import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Flame,
  GitBranch,
  Network,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import type { TrafficFlow, TrafficLinkData } from "../../types/traffic";
import StatusBadge from "../ui/StatusBadge";

interface TrafficLinkDrawerProps {
  link: TrafficLinkData | null;
  flows: TrafficFlow[];
  onClose: () => void;
  onSimulateCongestion: (linkId: string) => void;
  onToggleLinkFailure: (linkId: string) => void;
  onRerouteAffectedFlows: () => void;
  onResetLink: (linkId: string) => void;
}

export default function TrafficLinkDrawer({
  link,
  flows,
  onClose,
  onSimulateCongestion,
  onToggleLinkFailure,
  onRerouteAffectedFlows,
  onResetLink,
}: TrafficLinkDrawerProps) {
  if (!link) return null;

  const isDown = link.status === "down";
  const isCongested = link.status === "congested" || link.utilizationPercent >= 90;

  // Flows traversing this specific link
  const linkFlows = flows.filter((f) => {
    for (let i = 0; i < f.path.length - 1; i++) {
      const u = f.path[i].toLowerCase();
      const v = f.path[i + 1].toLowerCase();
      const s = link.source.toLowerCase();
      const t = link.target.toLowerCase();
      if ((u === s && v === t) || (u === t && v === s)) return true;
    }
    return false;
  });

  const affectedFlows = linkFlows.filter(
    (f) => f.status === "congested" || f.status === "degraded"
  );

  return (
    <AnimatePresence>
      <motion.aside
        className="device-inspector-drawer traffic-link-drawer"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-icon-box">
              <Network size={20} />
            </div>
            <div>
              <p className="drawer-eyebrow">LINK TRAFFIC TELEMETRY</p>
              <h2>
                {link.sourceName} <span className="text-muted">→</span> {link.targetName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close Link Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Banner */}
        <div className="drawer-status-banner">
          <StatusBadge
            status={
              isDown
                ? "critical"
                : isCongested
                ? "critical"
                : link.status === "high"
                ? "degraded"
                : "live"
            }
            label={link.status.toUpperCase()}
          />
          <span className="drawer-device-type">
            CAPACITY: {link.capacityMbps >= 10000 ? `${link.capacityMbps / 1000} Gbps` : `${link.capacityMbps} Mbps`}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="drawer-body">
          <div className="info-grid">
            <div className="info-card">
              <span>UTILIZATION</span>
              <strong
                style={{
                  color: isDown
                    ? "var(--critical)"
                    : isCongested
                    ? "var(--critical)"
                    : link.status === "high"
                    ? "var(--degraded)"
                    : "var(--healthy)",
                }}
              >
                {link.utilizationPercent}%
              </strong>
            </div>

            <div className="info-card">
              <span>THROUGHPUT</span>
              <strong>{link.throughputMbps} Mbps</strong>
            </div>

            <div className="info-card">
              <span>PACKETS / SEC</span>
              <strong>{link.packetsPerSec.toLocaleString()}</strong>
            </div>

            <div className="info-card">
              <span>PACKET LOSS</span>
              <strong style={{ color: link.packetLossPercent > 1 ? "var(--critical)" : undefined }}>
                {link.packetLossPercent}%
              </strong>
            </div>

            <div className="info-card">
              <span>ACTIVE FLOWS</span>
              <strong>{linkFlows.length}</strong>
            </div>

            <div className="info-card">
              <span>AFFECTED FLOWS</span>
              <strong style={{ color: affectedFlows.length > 0 ? "var(--critical)" : "var(--healthy)" }}>
                {affectedFlows.length}
              </strong>
            </div>
          </div>

          {/* Active / Traversed Flows Section */}
          <div className="drawer-flows-section">
            <div className="section-label-row">
              <span className="panel-eyebrow">TRAVERSING FLOWS ({linkFlows.length})</span>
            </div>
            <div className="link-flows-mini-list">
              {linkFlows.length === 0 ? (
                <div className="text-xs text-muted py-2">No active flows mapped to this link</div>
              ) : (
                linkFlows.map((f) => (
                  <div key={f.id} className="link-flow-mini-item">
                    <span className="mini-flow-id">{f.id}</span>
                    <span className="mini-flow-route">
                      {f.sourceName} → {f.destinationName}
                    </span>
                    <span className="mini-flow-rate">{f.throughputMbps}M</span>
                    <span className={`mini-flow-status ${f.status}`}>{f.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alternate Path Recommendation if Congested */}
          {isCongested && (
            <div className="drawer-congested-alert">
              <div className="alert-top">
                <AlertTriangle size={15} style={{ color: "var(--critical)" }} />
                <strong>High Utilization Alert</strong>
              </div>
              <p>
                Link throughput exceeds 90% threshold. Buffer saturation and packet drops detected.
              </p>
              <div className="alternate-path-box">
                <span className="alt-title">CALCULATED ALTERNATE PATH:</span>
                <span className="alt-route">
                  {link.sourceName} → CORE-01 → {link.targetName}
                </span>
                <span className="alt-caption">Simulated reroute via Core carrier trunk</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="drawer-actions-stack">
            <span className="panel-eyebrow">SIMULATION ACTIONS</span>

            {/* 1. Simulate Congestion */}
            <button
              type="button"
              className={`drawer-action-btn ${isCongested ? "active" : ""}`}
              onClick={() => onSimulateCongestion(link.id)}
            >
              <Flame size={14} />
              <span>{isCongested ? "Clear Congestion" : "Simulate Congestion"}</span>
            </button>

            {/* 2. Calculate Alternate Path / Reroute */}
            {isCongested && affectedFlows.length > 0 && (
              <button
                type="button"
                className="drawer-action-btn highlight"
                onClick={onRerouteAffectedFlows}
              >
                <GitBranch size={14} />
                <span>Calculate Alternate Path & Reroute</span>
              </button>
            )}

            {/* 3. Simulate Link Failure */}
            <button
              type="button"
              className={`drawer-action-btn ${isDown ? "critical" : ""}`}
              onClick={() => onToggleLinkFailure(link.id)}
            >
              <ShieldAlert size={14} />
              <span>{isDown ? "Restore Link Failure" : "Simulate Link Failure"}</span>
            </button>

            {/* 4. Reset Link */}
            {(isCongested || isDown) && (
              <button
                type="button"
                className="drawer-action-btn text-muted"
                onClick={() => onResetLink(link.id)}
              >
                <RotateCcw size={14} />
                <span>Reset to Baseline</span>
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
