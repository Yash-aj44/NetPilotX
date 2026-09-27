import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getNetworkState,
  getNetworkTopology,
} from "../services/api";

import type {
  NetworkState,
  NetworkTopology,
} from "../types/network";

interface FailureAlert {
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
}

interface NetworkContextValue {
  topology: NetworkTopology | null;
  networkState: NetworkState | null;

  failureAlert: FailureAlert | null;
  failureAlertVisible: boolean;

  incidents: IncidentRecord[];

  loading: boolean;

  refreshNetwork: () => Promise<void>;

  failDevice: (deviceId: string) => void;

  recoverNetwork: () => void;

  dismissFailureAlert: () => void;
}

const NetworkContext =
  createContext<NetworkContextValue | undefined>(
    undefined
  );

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({
  children,
}: NetworkProviderProps) {
  const [topology, setTopology] =
    useState<NetworkTopology | null>(null);

  const [networkState, setNetworkState] =
    useState<NetworkState | null>(null);

  /*
   * Represents the actual active network failure.
   *
   * This remains active even when the notification
   * itself is dismissed.
   */
  const [failureAlert, setFailureAlert] =
    useState<FailureAlert | null>(null);

  /*
   * Controls only the visibility of the
   * failure notification.
   */
  const [
    failureAlertVisible,
    setFailureAlertVisible,
  ] = useState(false);

  /*
   * Stores all incidents created during
   * the current application session.
   */
  const [incidents, setIncidents] =
    useState<IncidentRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  /*
   * Load the initial simulated network.
   */
  const refreshNetwork = async () => {
    setLoading(true);

    try {
      const [
        topologyData,
        stateData,
      ] = await Promise.all([
        getNetworkTopology(),
        getNetworkState(),
      ]);

      setTopology(topologyData);
      setNetworkState(stateData);

      /*
       * The mock API represents a healthy
       * initial network.
       *
       * Only clear the active failure when
       * the loaded topology has no failed node.
       */
      const hasExistingFailure =
        topologyData.nodes.some(
          (node) => node.status === "down"
        );

      if (!hasExistingFailure) {
        setFailureAlert(null);
        setFailureAlertVisible(false);
      }
    } catch (error) {
      console.error(
        "Failed to load network:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load the simulated network once.
   *
   * NetworkProvider is above the router,
   * so navigating between pages does not
   * destroy the network state.
   */
  useEffect(() => {
    refreshNetwork();
  }, []);

  /*
   * Inject a simulated device failure.
   */
  const failDevice = (deviceId: string) => {
    if (!topology || !networkState) {
      return;
    }

    /*
     * Only one active failure is allowed
     * at a time in the current simulation.
     */
    if (failureAlert) {
      return;
    }

    const failedNode =
      topology.nodes.find(
        (node) => node.id === deviceId
      );

    if (!failedNode) {
      return;
    }

    /*
     * Prevent failing an already-down device.
     */
    if (failedNode.status === "down") {
      return;
    }

    const affectedSystems =
      failedNode.connectedSystems ?? 0;

    /*
     * Update failed node.
     */
    const updatedNodes =
      topology.nodes.map((node) =>
        node.id === deviceId
          ? {
              ...node,
              status: "down" as const,
            }
          : node
      );

    /*
     * Update all links connected to
     * the failed device.
     */
    const updatedEdges =
      topology.edges.map((edge) =>
        edge.source === deviceId ||
        edge.target === deviceId
          ? {
              ...edge,
              status: "down" as const,
              packetLoss: 100,
              latency: 0,
            }
          : edge
      );

    /*
     * Update device telemetry.
     */
    const updatedDevices =
      networkState.devices.map(
        (device) =>
          device.id === deviceId
            ? {
                ...device,
                status: "down" as const,
                packetLoss: 100,
                latency: 0,
              }
            : device
      );

    /*
     * Calculate new network totals.
     */
    const newActiveSystems =
      Math.max(
        0,
        networkState.activeSystems -
          affectedSystems
      );

    const newOfflineSystems =
      networkState.offlineSystems +
      affectedSystems;

    const newNetworkHealth =
      networkState.totalSystems > 0
        ? Math.round(
            (newActiveSystems /
              networkState.totalSystems) *
              100
          )
        : 0;

    /*
     * Build updated topology.
     */
    const updatedTopology: NetworkTopology = {
      ...topology,
      nodes: updatedNodes,
      edges: updatedEdges,
    };

    setTopology(updatedTopology);

    /*
     * Build updated network state.
     */
    const updatedNetworkState: NetworkState = {
      ...networkState,
      devices: updatedDevices,
      activeSystems: newActiveSystems,
      offlineSystems: newOfflineSystems,
      networkHealth: newNetworkHealth,
      topology: updatedTopology,
    };

    setNetworkState(updatedNetworkState);

    /*
     * Create active failure.
     */
    const newFailureAlert: FailureAlert = {
      deviceId,
      deviceName: failedNode.name,
      affectedSystems,
    };

    setFailureAlert(newFailureAlert);

    /*
     * Create incident history record.
     */
    const newIncident: IncidentRecord = {
      id: `INC-${Date.now()}`,
      deviceId,
      deviceName: failedNode.name,
      affectedSystems,
      status: "active",
      detectedAt:
        new Date().toISOString(),
    };

    setIncidents(
      (currentIncidents) => [
        newIncident,
        ...currentIncidents,
      ]
    );

    /*
     * Display the notification.
     */
    setFailureAlertVisible(true);
  };

  /*
   * Dismiss only the notification.
   *
   * The failure and incident remain active.
   */
  const dismissFailureAlert = () => {
    setFailureAlertVisible(false);
  };

  /*
   * Recover the currently failed device.
   */
  const recoverNetwork = () => {
    if (
      !topology ||
      !networkState ||
      !failureAlert
    ) {
      return;
    }

    const failedDeviceId =
      failureAlert.deviceId;

    /*
     * Restore failed topology node.
     */
    const recoveredNodes =
      topology.nodes.map((node) =>
        node.id === failedDeviceId
          ? {
              ...node,
              status: "up" as const,
            }
          : node
      );

    /*
     * Restore links connected to
     * the recovered device.
     */
    const recoveredEdges =
      topology.edges.map((edge) =>
        edge.source === failedDeviceId ||
        edge.target === failedDeviceId
          ? {
              ...edge,
              status: "up" as const,
              packetLoss: 0,
            }
          : edge
      );

    /*
     * Restore device telemetry.
     */
    const recoveredDevices =
      networkState.devices.map(
        (device) =>
          device.id === failedDeviceId
            ? {
                ...device,
                status: "up" as const,
                packetLoss: 0,
                latency:
                  device.latency &&
                  device.latency > 0
                    ? device.latency
                    : 2,
              }
            : device
      );

    /*
     * Build recovered topology.
     */
    const recoveredTopology: NetworkTopology = {
      ...topology,
      nodes: recoveredNodes,
      edges: recoveredEdges,
    };

    setTopology(recoveredTopology);

    /*
     * Build recovered network state.
     */
    const recoveredNetworkState: NetworkState = {
      ...networkState,
      devices: recoveredDevices,
      activeSystems:
        networkState.totalSystems,
      offlineSystems: 0,
      networkHealth: 100,
      topology: recoveredTopology,
    };

    setNetworkState(recoveredNetworkState);

    /*
     * Mark the corresponding active incident
     * as resolved.
     */
    setIncidents(
      (currentIncidents) =>
        currentIncidents.map(
          (incident) =>
            incident.status === "active" &&
            incident.deviceId ===
              failedDeviceId
              ? {
                  ...incident,
                  status: "resolved",
                  resolvedAt:
                    new Date().toISOString(),
                }
              : incident
        )
    );

    /*
     * Remove the active failure.
     */
    setFailureAlert(null);

    /*
     * Hide the notification.
     */
    setFailureAlertVisible(false);
  };

  /*
   * Context value.
   */
  const contextValue: NetworkContextValue = {
    topology,
    networkState,

    failureAlert,
    failureAlertVisible,

    incidents,

    loading,

    refreshNetwork,

    failDevice,

    recoverNetwork,

    dismissFailureAlert,
  };

  return (
    <NetworkContext.Provider
      value={contextValue}
    >
      {children}
    </NetworkContext.Provider>
  );
}

/*
 * Custom hook.
 */
export function useNetwork() {
  const context =
    useContext(NetworkContext);

  if (!context) {
    throw new Error(
      "useNetwork must be used inside NetworkProvider"
    );
  }

  return context;
}