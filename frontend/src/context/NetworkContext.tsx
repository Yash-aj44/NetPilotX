import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getAlerts,
  getIncidents,
  getMonitoring,
  getNetworkState,
  getNetworkTopology,
  getTraffic,
  restoreDevice,
  simulateDeviceFailure,
  type BackendAlert,
  type BackendIncident,
  type MonitoringDeviceData,
  type TrafficDeviceData,
} from "../services/api";

import { wsManager } from "../services/websocket";

import type {
  NetworkState,
  NetworkTopology,
} from "../types/network";

export interface FailureAlert {
  deviceId: string;
  deviceName: string;
  affectedSystems: number;
}

export interface IncidentRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  affectedSystems: number;
  status: "active" | "resolved";
  detectedAt: string;
  resolvedAt?: string;
  title?: string;
  severity?: string;
  rootCause?: string;
  affectedSystemsList?: string[];
}

interface NetworkContextValue {
  topology: NetworkTopology | null;
  networkState: NetworkState | null;

  failureAlert: FailureAlert | null;
  failureAlertVisible: boolean;

  incidents: IncidentRecord[];
  alerts: BackendAlert[];
  monitoring: MonitoringDeviceData[];
  traffic: TrafficDeviceData[];

  loading: boolean;
  error: string | null;

  refreshNetwork: () => Promise<void>;
  failDevice: (deviceId: string) => Promise<void>;
  recoverNetwork: () => Promise<void>;
  dismissFailureAlert: () => void;
}

const NetworkContext =
  createContext<NetworkContextValue | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [failureAlert, setFailureAlert] = useState<FailureAlert | null>(null);
  const [failureAlertVisible, setFailureAlertVisible] = useState(false);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringDeviceData[]>([]);
  const [traffic, setTraffic] = useState<TrafficDeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request Sequence Counter to eliminate race conditions (latest-request-wins)
  const requestIdRef = useRef(0);
  const debouncedTimerRef = useRef<number | null>(null);

  /*
   * Refresh all network state from FastAPI backend (Single Source of Truth)
   */
  const refreshNetwork = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      // 1. Core topology and state fetch
      const [topologyData, stateData] = await Promise.all([
        getNetworkTopology(),
        getNetworkState(),
      ]);

      // Check for stale response
      if (requestId !== requestIdRef.current) {
        return;
      }

      setTopology(topologyData);
      setNetworkState(stateData);
      setError(null);

      // 2. Auxiliary telemetry endpoints using Promise.allSettled
      const [alertsRes, incidentsRes, monitoringRes, trafficRes] = await Promise.allSettled([
        getAlerts(),
        getIncidents(),
        getMonitoring(),
        getTraffic(),
      ]);

      // Verify sequence ID again after async operations
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (alertsRes.status === "fulfilled") {
        setAlerts(alertsRes.value || []);
      }

      if (incidentsRes.status === "fulfilled" && Array.isArray(incidentsRes.value)) {
        const mappedIncidents: IncidentRecord[] = incidentsRes.value.map((bi: BackendIncident) => {
          const rootDevice =
            bi.root_cause || (bi.id ? bi.id.replace("INC-", "").toLowerCase() : "edge-05");
          const deviceName = rootDevice.toUpperCase();

          return {
            id: bi.id,
            deviceId: rootDevice,
            deviceName,
            affectedSystems:
              bi.affected_count || (bi.affected_systems ? bi.affected_systems.length : 0),
            status: bi.status === "open" || bi.status === "active" ? "active" : "resolved",
            detectedAt: bi.created_at || new Date().toISOString(),
            title: bi.title,
            severity: bi.severity,
            rootCause: bi.root_cause,
            affectedSystemsList: bi.affected_systems,
          };
        });
        setIncidents(mappedIncidents);
      }

      if (monitoringRes.status === "fulfilled") {
        setMonitoring(monitoringRes.value || []);
      }

      if (trafficRes.status === "fulfilled") {
        setTraffic(trafficRes.value || []);
      }

      // Reconstruct failure alert state if backend has down devices
      const downDevices = Array.isArray(topologyData.nodes)
        ? topologyData.nodes.filter((n) => n.status === "down")
        : [];

      if (downDevices.length > 0) {
        const failedNode = downDevices[0];
        const affectedSystems = stateData.offlineSystems || failedNode.connectedSystems || 22;

        setFailureAlert({
          deviceId: failedNode.id,
          deviceName: failedNode.name || failedNode.id.toUpperCase(),
          affectedSystems,
        });
        setFailureAlertVisible(true);
      } else {
        setFailureAlert(null);
        setFailureAlertVisible(false);
      }
    } catch (err: any) {
      if (requestId === requestIdRef.current) {
        console.error("Failed to load backend network state:", err);
        setError(err?.message || "Failed to communicate with NetPilot X backend API.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  /*
   * Initialize state & connect WebSocket stream with debounced event handler
   */
  useEffect(() => {
    refreshNetwork();

    wsManager.connect();

    const triggerDebouncedRefresh = () => {
      if (debouncedTimerRef.current) {
        clearTimeout(debouncedTimerRef.current);
      }
      debouncedTimerRef.current = window.setTimeout(() => {
        debouncedTimerRef.current = null;
        refreshNetwork();
      }, 150);
    };

    const unsubscribe = wsManager.subscribe(() => {
      triggerDebouncedRefresh();
    });

    return () => {
      if (debouncedTimerRef.current) {
        clearTimeout(debouncedTimerRef.current);
      }
      unsubscribe();
    };
  }, []);

  /*
   * Inject a device failure via FastAPI backend
   */
  const failDevice = async (deviceId: string) => {
    if (failureAlert) {
      return;
    }

    try {
      await simulateDeviceFailure(deviceId);
      await refreshNetwork();
    } catch (err: any) {
      console.error("Failed to simulate device failure:", err);
    }
  };

  /*
   * Dismiss notification popup only
   */
  const dismissFailureAlert = () => {
    setFailureAlertVisible(false);
  };

  /*
   * Recover failed network device via FastAPI backend
   */
  const recoverNetwork = async () => {
    if (!failureAlert) {
      return;
    }

    const failedDeviceId = failureAlert.deviceId;

    try {
      await restoreDevice(failedDeviceId);
      await refreshNetwork();
    } catch (err: any) {
      console.error("Failed to restore device:", error);
    }
  };

  const contextValue: NetworkContextValue = {
    topology,
    networkState,
    failureAlert,
    failureAlertVisible,
    incidents,
    alerts,
    monitoring,
    traffic,
    loading,
    error,
    refreshNetwork,
    failDevice,
    recoverNetwork,
    dismissFailureAlert,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error("useNetwork must be used inside NetworkProvider");
  }

  return context;
}