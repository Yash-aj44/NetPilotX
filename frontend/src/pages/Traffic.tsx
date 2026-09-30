import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Flame,
  GitBranch,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useNetwork } from "../context/NetworkContext";
import StatusBadge from "../components/ui/StatusBadge";
import TextReveal from "../components/ui/TextReveal";
import TrafficKpiCards from "../components/traffic/TrafficKpiCards";
import TrafficTopology from "../components/traffic/TrafficTopology";
import TrafficFlowList from "../components/traffic/TrafficFlowList";
import TrafficLinkDrawer from "../components/traffic/TrafficLinkDrawer";
import TrafficLegend from "../components/traffic/TrafficLegend";
import TrafficChart from "../components/traffic/TrafficChart";
import {
  initializeTrafficState,
  rerouteAllAffectedFlows,
  simulateFlowReroute,
  simulateLinkCongestion,
  syncWithBackendNetworkState,
} from "../services/traffic";
import {
  simulateLinkFailure as apiSimulateLinkFailure,
  restoreLink as apiRestoreLink,
} from "../services/api";
import type { TrafficSimulationState } from "../types/traffic";

export default function Traffic() {
  const { topology, loading, error, refreshNetwork } = useNetwork();

  // Traffic Simulation State
  const [simulationState, setSimulationState] = useState<TrafficSimulationState | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);

  // Pure derived Traffic State (always synchronized with backend topology)
  const trafficState = useMemo(() => {
    if (simulationState) {
      if (topology) {
        return syncWithBackendNetworkState(simulationState, topology.nodes, topology.edges);
      }
      return simulationState;
    }
    if (!topology) return null;
    const initial = initializeTrafficState(topology.nodes, topology.edges);
    return syncWithBackendNetworkState(initial, topology.nodes, topology.edges);
  }, [topology, simulationState]);

  // Derived selected link
  const selectedLink = useMemo(() => {
    if (!selectedLinkId || !trafficState) return null;
    return trafficState.links.find((l) => l.id === selectedLinkId) || null;
  }, [selectedLinkId, trafficState]);

  // Derived selected flow
  const selectedFlow = useMemo(() => {
    if (!selectedFlowId || !trafficState) return null;
    return trafficState.flows.find((f) => f.id === selectedFlowId) || null;
  }, [selectedFlowId, trafficState]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  // 1. Simulate Congestion on a link (e.g. DIST-02 → EDGE-06 or current link)
  const handleSimulateCongestion = (targetLinkId?: string) => {
    if (!trafficState) return;

    // Pick target: explicit linkId, or currently selected link, or default to dist-02-edge-06
    let linkId = targetLinkId || selectedLinkId;
    if (!linkId) {
      const candidate =
        trafficState.links.find((l) => l.id.includes("dist-02-edge-06")) ||
        trafficState.links.find((l) => l.id.includes("core-01-dist-02")) ||
        trafficState.links[0];
      linkId = candidate.id;
    }

    const currentLink = trafficState.links.find((l) => l.id === linkId);
    if (currentLink && currentLink.status === "congested") {
      // Toggle off congestion if already congested
      handleResetLink(linkId);
      return;
    }

    const newState = simulateLinkCongestion(trafficState, linkId);
    setSimulationState(newState);
    setSelectedLinkId(linkId);
  };

  // 2. Simulate Link Failure (using backend API or simulated fallback)
  const handleToggleLinkFailure = async (linkId: string) => {
    if (!trafficState) return;
    const targetLink = trafficState.links.find((l) => l.id === linkId);
    if (!targetLink) return;

    try {
      if (targetLink.status === "down") {
        await apiRestoreLink(linkId);
      } else {
        await apiSimulateLinkFailure(linkId);
      }
      await refreshNetwork();
    } catch (err) {
      console.warn("API link failure fallback to frontend simulation:", err);
      // Frontend fallback
      setSimulationState((prev) => {
        const base = prev || trafficState;
        const updatedLinks = base.links.map((l) => {
          if (l.id === linkId) {
            const nextDown = l.status !== "down";
            return {
              ...l,
              status: nextDown ? ("down" as const) : ("normal" as const),
              utilizationPercent: nextDown ? 0 : 45,
              throughputMbps: nextDown ? 0 : Math.round(l.capacityMbps * 0.45),
              packetLossPercent: nextDown ? 100 : 0.1,
            };
          }
          return l;
        });
        return { ...base, links: updatedLinks };
      });
    }
  };

  // 3. Reroute an individual flow
  const handleRerouteFlow = (flowId: string) => {
    if (!trafficState) return;
    const newState = simulateFlowReroute(trafficState, flowId);
    setSimulationState(newState);
  };

  // 4. Calculate alternate path and reroute all affected flows
  const handleRerouteAllAffected = () => {
    if (!trafficState) return;
    const newState = rerouteAllAffectedFlows(trafficState);
    setSimulationState(newState);
  };

  // 5. Reset a single link to normal
  const handleResetLink = (linkId: string) => {
    if (!trafficState || !topology) return;
    const baseline = initializeTrafficState(topology.nodes, topology.edges);
    const baseLink = baseline.links.find((l) => l.id === linkId);
    if (!baseLink) return;

    const updatedLinks = trafficState.links.map((l) => (l.id === linkId ? baseLink : l));
    setSimulationState({
      ...trafficState,
      links: updatedLinks,
      activeCongestionLinkId:
        trafficState.activeCongestionLinkId === linkId ? null : trafficState.activeCongestionLinkId,
    });
  };

  // 6. Reset all traffic simulation
  const handleResetAllTraffic = () => {
    setSimulationState(null);
    setSelectedLinkId(null);
    setSelectedFlowId(null);
  };

  // ---------------------------------------------------------------------------
  // Loading & Error States
  // ---------------------------------------------------------------------------
  if (loading && !trafficState) {
    return (
      <div className="page-loading-center">
        <Activity size={24} style={{ color: "var(--accent)" }} className="animate-spin" />
        <span>Loading NetPilot X Traffic Intelligence Engine...</span>
      </div>
    );
  }

  if (error || !topology || !trafficState) {
    return (
      <div className="page-loading-center text-center p-6">
        <ShieldAlert size={36} style={{ color: "var(--critical)" }} className="mb-3 mx-auto" />
        <h3 className="text-lg font-semibold text-slate-200 mb-1">
          Traffic Telemetry Unavailable
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
          {error || "Unable to synchronize traffic telemetry with NetPilot X topology."}
        </p>
        <button
          type="button"
          className="recover-action-btn px-4 py-2"
          onClick={refreshNetwork}
        >
          <RefreshCw size={14} className="inline mr-2" />
          Retry Connection
        </button>
      </div>
    );
  }

  const isCongestedState =
    trafficState.simulationStatus === "congested" ||
    trafficState.links.some((l) => l.status === "congested");

  const cubicEase = [0.16, 1, 0.3, 1] as const;

  return (
    <motion.div
      className="traffic-page-container"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.35, ease: cubicEase }}
    >
      {/* 1. Header Bar matching NetPilot X standard */}
      <div className="traffic-top-action-bar">
        <div className="bar-title-group">
          <p className="page-eyebrow">TRAFFIC INTELLIGENCE</p>
          <TextReveal text="Real-time traffic analysis and path optimization" as="h1" />
        </div>

        {/* Global Controls & Status */}
        <div className="traffic-controls-right">
          <StatusBadge
            status={isCongestedState ? "critical" : "live"}
            label={isCongestedState ? "CONGESTION DETECTED" : "SIMULATION ONLINE"}
          />

          {/* Quick Congestion Simulation Button */}
          <button
            type="button"
            className={`page-action-btn ${isCongestedState ? "active-alert-btn" : ""}`}
            onClick={() => handleSimulateCongestion()}
            title="Simulate congestion on primary link"
          >
            <Flame size={14} style={{ color: isCongestedState ? "var(--critical)" : "var(--accent)" }} />
            <span>{isCongestedState ? "Congestion Active" : "Simulate Congestion"}</span>
          </button>

          {/* Alternate Path & Reroute Button */}
          {isCongestedState && (
            <button
              type="button"
              className="page-action-btn highlight-btn"
              onClick={handleRerouteAllAffected}
              title="Apply calculated alternate paths to reroute affected flows"
            >
              <GitBranch size={14} />
              <span>Simulated Reroute</span>
            </button>
          )}

          {/* Reset Simulation Button */}
          <button
            type="button"
            className="page-action-btn"
            onClick={handleResetAllTraffic}
            title="Reset traffic simulation to baseline"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          {/* Refresh Telemetry */}
          <button
            type="button"
            className="page-action-btn"
            onClick={refreshNetwork}
            disabled={loading}
            title="Refresh network telemetry"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards Row */}
      <TrafficKpiCards kpis={trafficState.kpis} />

      {/* 3. Main Split Workspace: Topology Stage (Left) & Telemetry / Flows (Right) */}
      <div className="traffic-workspace-layout">
        {/* Left Column: Topology Canvas & Legend */}
        <div className="traffic-topology-column">
          <div className="traffic-stage-card">
            <div className="stage-top-meta">
              <span className="panel-eyebrow">SDN TOPOLOGY OVERLAY</span>
              <TrafficLegend />
            </div>

            <TrafficTopology
              nodes={topology.nodes}
              edges={topology.edges}
              trafficLinks={trafficState.links}
              selectedFlow={selectedFlow}
              selectedLinkId={selectedLinkId}
              onLinkSelect={(link) => setSelectedLinkId(link ? link.id : null)}
            />
          </div>
        </div>

        {/* Right Column: Flows List & Telemetry Chart */}
        <div className="traffic-side-column">
          {/* Active Traffic Flows List */}
          <TrafficFlowList
            flows={trafficState.flows}
            selectedFlowId={selectedFlowId}
            onSelectFlow={(id) => setSelectedFlowId(id)}
            onRerouteFlow={handleRerouteFlow}
          />

          {/* Small Demand vs Delivered Trend Chart */}
          <div className="traffic-chart-panel">
            <TrafficChart data={trafficState.history} />
          </div>
        </div>
      </div>

      {/* 4. Link Inspector Drawer Overlay */}
      {selectedLink && (
        <TrafficLinkDrawer
          link={selectedLink}
          flows={trafficState.flows}
          onClose={() => setSelectedLinkId(null)}
          onSimulateCongestion={handleSimulateCongestion}
          onToggleLinkFailure={handleToggleLinkFailure}
          onRerouteAffectedFlows={handleRerouteAllAffected}
          onResetLink={handleResetLink}
        />
      )}
    </motion.div>
  );
}
