import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Activity, ShieldAlert, AlertTriangle, X, Server } from "lucide-react";
import NetworkTopology from "../components/network/NetworkTopology";
import SimulationControls from "../components/network/SimulationControls";
import DeviceDrawer from "../components/network/DeviceDrawer";
import { useNetwork } from "../context/NetworkContext";
import StatusBadge from "../components/ui/StatusBadge";
import TextReveal from "../components/ui/TextReveal";
import type { NetworkNode } from "../types/network";

export default function Network() {
  const [searchParams] = useSearchParams();
  const targetDeviceId = searchParams.get("device");

  const {
    topology,
    networkState,
    failureAlert,
    loading,
    error,
    refreshNetwork,
    failDevice,
    recoverNetwork,
    dismissFailureAlert,
  } = useNetwork();

  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [showIncidentDrawer, setShowIncidentDrawer] = useState(false);

  // Sync search param device if provided
  useEffect(() => {
    if (targetDeviceId && topology) {
      const match = topology.nodes.find((n) => n.id.toLowerCase() === targetDeviceId.toLowerCase());
      if (match) setSelectedNode(match);
    }
  }, [targetDeviceId, topology]);

  const selectedDevice = selectedNode
    ? networkState?.devices.find((d) => d.id === selectedNode.id) || null
    : null;

  if (loading && !topology) {
    return (
      <div className="page-loading-center">
        <Activity size={24} style={{ color: "var(--accent)" }} className="animate-spin" />
        <span>Loading NetPilot X Topology Engine...</span>
      </div>
    );
  }

  if (error || !topology || !networkState) {
    return (
      <div className="page-loading-center text-center p-6">
        <ShieldAlert size={36} style={{ color: "var(--critical)" }} className="mb-3 mx-auto" />
        <h3 className="text-lg font-semibold text-slate-200 mb-1">
          Topology Connection Issue
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
          {error || "Unable to retrieve topology state from NetPilot X backend."}
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

  const networkStatus =
    networkState.networkHealth >= 95
      ? "Operational"
      : networkState.networkHealth >= 70
      ? "Degraded"
      : "Critical";

  const onlineSystems = networkState.totalSystems - networkState.offlineSystems;
  const cubicEase = [0.16, 1, 0.3, 1] as const;

  return (
    <motion.div
      className="network-page-container"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.4, ease: cubicEase }}
    >
      {/* Top Streamlined Operations & Controls Bar */}
      <div className="network-top-action-bar">
        <div className="bar-title-group">
          <p className="page-eyebrow">LIVE TOPOLOGY ENGINE</p>
          <TextReveal text="Enterprise Core Architecture" as="h1" />
        </div>

        {/* Quick Stat Chips & Legend */}
        <div className="network-stat-chips-row">
          <div className="chip-item">
            <Server size={14} style={{ color: "var(--accent)" }} />
            <span>Switches:</span>
            <strong>{topology.nodes.length}</strong>
          </div>

          <div className="chip-item">
            <Activity size={14} style={{ color: "var(--healthy)" }} />
            <span>Online:</span>
            <strong>{onlineSystems} / {networkState.totalSystems}</strong>
          </div>

          <div className="chip-item">
            <ShieldAlert size={14} style={{ color: networkState.offlineSystems > 0 ? "var(--critical)" : "var(--text-muted)" }} />
            <span>Offline:</span>
            <strong>{networkState.offlineSystems}</strong>
          </div>

          <div className="topology-legend-bar">
            <span className="legend-item">
              <i className="legend-dot up" /> Up
            </span>
            <span className="legend-item">
              <i className="legend-dot down" /> Down
            </span>
          </div>
        </div>

        {/* Simulation Controls & Actions */}
        <div className="network-controls-right">
          <SimulationControls
            devices={networkState.devices}
            onFailure={(deviceId) => {
              failDevice(deviceId);
            }}
          />

          <StatusBadge status={networkStatus} />

          <button
            type="button"
            className="page-action-btn"
            onClick={refreshNetwork}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main D3 + SVG + GSAP Topology Workspace Canvas (Dominant Stage) */}
      <section className="topology-workspace-panel">
        <div className="topology-stage">
          <NetworkTopology
            nodes={topology.nodes}
            edges={topology.edges}
            onNodeSelect={(node) => setSelectedNode(node)}
          />

          {/* Selected Device Drawer Overlay */}
          {selectedNode && !showIncidentDrawer && (
            <DeviceDrawer
              selectedNode={selectedNode}
              selectedDevice={selectedDevice}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      </section>

      {/* Active Failure Alert Toast */}
      {failureAlert && !showIncidentDrawer && (
        <div className="failure-alert-toast">
          <div className="failure-alert-icon">
            <AlertTriangle size={20} style={{ color: "var(--critical)" }} />
          </div>
          <div className="failure-alert-content">
            <span className="alert-severity-tag">CRITICAL FAILURE ALERT</span>
            <strong>{failureAlert.deviceName} Unreachable</strong>
            <p>{failureAlert.affectedSystems} endpoint systems currently offline.</p>
            <button
              type="button"
              className="failure-alert-btn"
              onClick={() => setShowIncidentDrawer(true)}
            >
              Investigate Incident
            </button>
          </div>
          <button
            type="button"
            className="failure-alert-dismiss"
            onClick={dismissFailureAlert}
          >
            ×
          </button>
        </div>
      )}

      {/* Incident Investigation Drawer Overlay */}
      {showIncidentDrawer && failureAlert && (
        <aside className="incident-drawer-overlay">
          <div className="incident-drawer-content">
            <div className="drawer-header">
              <div>
                <p className="panel-eyebrow">INCIDENT RESPONSE</p>
                <h2>Edge Switch Uplink Failure</h2>
                <p className="incident-subtitle">
                  {failureAlert.deviceName} unreachable — {failureAlert.affectedSystems} systems affected
                </p>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setShowIncidentDrawer(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="incident-status-pills">
              <StatusBadge status="critical" label="CRITICAL" />
              <StatusBadge status="degraded" label="OPEN" />
            </div>

            <div className="incident-drawer-body">
              <div className="incident-card-section">
                <p className="panel-eyebrow">ROOT CAUSE DIAGNOSIS</p>
                <div className="root-cause-box">
                  <strong>{failureAlert.deviceName} Link Interrupted</strong>
                  <p>
                    Simulated failure detected on Edge switch uplink interface. Connected endpoint
                    subnet is unreachable.
                  </p>
                </div>
              </div>

              <div className="incident-card-section">
                <p className="panel-eyebrow">NETWORK DEPENDENCY PATH</p>
                <div className="dependency-flow-path">
                  <span className="dep-node healthy">DIST-02</span>
                  <span className="dep-arrow" style={{ color: "var(--critical)" }}>⚡ LINK DOWN</span>
                  <span className="dep-node failed">{failureAlert.deviceName}</span>
                  <span className="dep-arrow">→</span>
                  <span className="dep-node affected">
                    {failureAlert.affectedSystems} Endpoints
                  </span>
                </div>
              </div>

              <div className="incident-actions-row">
                <button
                  type="button"
                  className="recover-action-btn"
                  onClick={() => {
                    recoverNetwork();
                    setShowIncidentDrawer(false);
                  }}
                >
                  Initiate Network Recovery Cascade
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </motion.div>
  );
}