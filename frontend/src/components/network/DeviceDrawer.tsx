import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Server, HardDrive, Cpu, Radio, Shield, Network } from "lucide-react";
import type { NetworkDevice, NetworkNode } from "../../types/network";
import StatusBadge from "../ui/StatusBadge";

interface DeviceDrawerProps {
  selectedNode: NetworkNode | null;
  selectedDevice: NetworkDevice | null;
  onClose: () => void;
}

export default function DeviceDrawer({
  selectedNode,
  selectedDevice,
  onClose,
}: DeviceDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "telemetry" | "endpoints">("overview");

  if (!selectedNode) return null;

  const isDown = selectedNode.status === "down";
  const cpu = isDown ? 0 : selectedDevice?.cpu ?? 35;
  const memory = isDown ? 0 : selectedDevice?.memory ?? 48;
  const latency = isDown ? 0 : selectedDevice?.latency ?? 8;
  const packetLoss = isDown ? 100 : selectedDevice?.packetLoss ?? 0;

  return (
    <AnimatePresence>
      <motion.aside
        className="device-inspector-drawer"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-icon-box">
              <Server size={20} className="text-cyan-400" />
            </div>
            <div>
              <p className="drawer-eyebrow">DEVICE TELEMETRY</p>
              <h2>{selectedNode.name}</h2>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Banner */}
        <div className="drawer-status-banner">
          <StatusBadge status={selectedNode.status} />
          <span className="drawer-device-type">{selectedNode.type.toUpperCase()} SWITCH</span>
        </div>

        {/* Navigation Tabs */}
        <div className="drawer-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "telemetry" ? "active" : ""}`}
            onClick={() => setActiveTab("telemetry")}
          >
            Telemetry
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "endpoints" ? "active" : ""}`}
            onClick={() => setActiveTab("endpoints")}
          >
            Endpoints ({selectedNode.connectedSystems ?? 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="drawer-body">
          {activeTab === "overview" && (
            <div className="tab-pane">
              <div className="info-grid">
                <div className="info-card">
                  <span>Device ID</span>
                  <strong>{selectedNode.id}</strong>
                </div>
                <div className="info-card">
                  <span>IP Address</span>
                  <strong>{selectedNode.ip || `192.168.10.${selectedNode.id}`}</strong>
                </div>
                <div className="info-card">
                  <span>MAC Address</span>
                  <strong>{selectedNode.mac || `00:1A:2B:3C:${selectedNode.id.toUpperCase()}`}</strong>
                </div>
                <div className="info-card">
                  <span>Parent Switch</span>
                  <strong>{selectedNode.parentId || "CORE-01"}</strong>
                </div>
              </div>

              <div className="telemetry-mini-summary">
                <div className="mini-telemetry-item">
                  <Cpu size={16} className="text-cyan-400" />
                  <div>
                    <span>CPU Utilization</span>
                    <strong>{cpu}%</strong>
                  </div>
                </div>
                <div className="mini-telemetry-item">
                  <HardDrive size={16} className="text-emerald-400" />
                  <div>
                    <span>Memory Usage</span>
                    <strong>{memory}%</strong>
                  </div>
                </div>
                <div className="mini-telemetry-item">
                  <Radio size={16} className="text-amber-400" />
                  <div>
                    <span>Network Latency</span>
                    <strong>{latency} ms</strong>
                  </div>
                </div>
                <div className="mini-telemetry-item">
                  <Shield size={16} className="text-rose-400" />
                  <div>
                    <span>Packet Loss</span>
                    <strong>{packetLoss}%</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "telemetry" && (
            <div className="tab-pane">
              <div className="telemetry-gauges-grid">
                <div className="gauge-card">
                  <span className="gauge-label">CPU LOAD</span>
                  <div className="gauge-bar-bg">
                    <div
                      className="gauge-bar-fill bg-cyan-400"
                      style={{ width: `${cpu}%` }}
                    />
                  </div>
                  <strong>{cpu}%</strong>
                </div>

                <div className="gauge-card">
                  <span className="gauge-label">MEMORY USAGE</span>
                  <div className="gauge-bar-bg">
                    <div
                      className="gauge-bar-fill bg-emerald-400"
                      style={{ width: `${memory}%` }}
                    />
                  </div>
                  <strong>{memory}%</strong>
                </div>

                <div className="gauge-card">
                  <span className="gauge-label">LATENCY (MS)</span>
                  <div className="gauge-bar-bg">
                    <div
                      className="gauge-bar-fill bg-amber-400"
                      style={{ width: `${Math.min(latency * 2, 100)}%` }}
                    />
                  </div>
                  <strong>{latency} ms</strong>
                </div>

                <div className="gauge-card">
                  <span className="gauge-label">PACKET LOSS</span>
                  <div className="gauge-bar-bg">
                    <div
                      className="gauge-bar-fill bg-rose-400"
                      style={{ width: `${packetLoss}%` }}
                    />
                  </div>
                  <strong>{packetLoss}%</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === "endpoints" && (
            <div className="tab-pane">
              <div className="endpoints-list">
                {Array.from({ length: selectedNode.connectedSystems || 10 }).map((_, idx) => (
                  <div className="endpoint-item-row" key={idx}>
                    <Network size={14} className="text-muted" />
                    <div className="ep-details">
                      <strong>SYS-{(idx + 1).toString().padStart(2, "0")}</strong>
                      <span>10.0.4.{(idx + 12).toString()}</span>
                    </div>
                    <StatusBadge
                      status={isDown ? "down" : "up"}
                      label={isDown ? "OFFLINE" : "ONLINE"}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
