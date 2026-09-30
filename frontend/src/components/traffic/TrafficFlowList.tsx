import { useState } from "react";
import { ArrowRight, GitBranch, Layers, Search, Zap } from "lucide-react";
import type { TrafficFlow } from "../../types/traffic";
import StatusBadge from "../ui/StatusBadge";

interface TrafficFlowListProps {
  flows: TrafficFlow[];
  selectedFlowId: string | null;
  onSelectFlow: (flowId: string | null) => void;
  onRerouteFlow: (flowId: string) => void;
}

export default function TrafficFlowList({
  flows,
  selectedFlowId,
  onSelectFlow,
  onRerouteFlow,
}: TrafficFlowListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredFlows = flows.filter((flow) => {
    const matchesSearch =
      flow.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.destinationName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "congested" && flow.status === "congested") ||
      (statusFilter === "rerouted" && flow.isRerouted) ||
      (statusFilter === "high" && flow.status === "high") ||
      (statusFilter === "normal" && flow.status === "normal");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="traffic-flow-panel">
      {/* Panel Header */}
      <div className="flow-panel-header">
        <div className="flow-title-wrapper">
          <Layers size={16} style={{ color: "var(--accent)" }} />
          <div>
            <span className="panel-eyebrow">FLOW TELEMETRY</span>
            <h3 className="flow-panel-title">Active Traffic Flows</h3>
          </div>
        </div>
        <span className="flow-count-tag">{flows.length} Monitored</span>
      </div>

      {/* Search & Filter Controls */}
      <div className="flow-controls-row">
        <div className="flow-search-box">
          <Search size={13} className="flow-search-icon" />
          <input
            type="text"
            placeholder="Search flow ID, device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flow-search-input"
          />
        </div>

        <div className="flow-filter-chips">
          <button
            type="button"
            className={`filter-chip ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-chip ${statusFilter === "congested" ? "active" : ""}`}
            onClick={() => setStatusFilter("congested")}
          >
            Congested
          </button>
          <button
            type="button"
            className={`filter-chip ${statusFilter === "rerouted" ? "active" : ""}`}
            onClick={() => setStatusFilter("rerouted")}
          >
            Rerouted
          </button>
        </div>
      </div>

      {/* Flow Cards List */}
      <div className="flow-cards-scroll">
        {filteredFlows.length === 0 ? (
          <div className="flow-empty-state">
            <span>No flows matching current filter</span>
          </div>
        ) : (
          filteredFlows.map((flow) => {
            const isSelected = flow.id === selectedFlowId;
            const isCongested = flow.status === "congested";
            const isRerouted = flow.isRerouted;

            return (
              <div
                key={flow.id}
                className={`traffic-flow-card ${isSelected ? "selected" : ""} ${
                  isCongested ? "congested" : ""
                } ${isRerouted ? "rerouted" : ""}`}
                onClick={() => onSelectFlow(isSelected ? null : flow.id)}
              >
                <div className="flow-card-top">
                  <div className="flow-id-group">
                    <span className="flow-id-badge">{flow.id}</span>
                    <span className="flow-protocol-tag">{flow.protocol}</span>
                  </div>

                  <div className="flow-status-group">
                    <StatusBadge
                      status={
                        flow.status === "congested" || flow.status === "degraded"
                          ? "critical"
                          : flow.status === "rerouted"
                          ? "recovering"
                          : flow.status === "high"
                          ? "degraded"
                          : "live"
                      }
                      label={flow.status.toUpperCase()}
                    />
                  </div>
                </div>

                <div className="flow-endpoints-row">
                  <span className="endpoint-node">{flow.sourceName}</span>
                  <ArrowRight size={13} className="endpoint-arrow" />
                  <span className="endpoint-node">{flow.destinationName}</span>
                  <span className="flow-rate-text">{flow.throughputMbps} Mbps</span>
                </div>

                {/* Path Hops */}
                <div className="flow-path-preview">
                  <span className="path-label">
                    {isRerouted ? "REROUTED PATH:" : "CURRENT PATH:"}
                  </span>
                  <div className="path-hops-chips">
                    {flow.path.map((hop, idx) => (
                      <span key={`${hop}-${idx}`} className="path-hop-chip">
                        {hop.toUpperCase()}
                        {idx < flow.path.length - 1 && <span className="hop-sep">→</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Alternate Path & Reroute Action */}
                {isCongested && flow.alternatePath && !isRerouted && (
                  <div className="flow-reroute-notice" onClick={(e) => e.stopPropagation()}>
                    <div className="reroute-info">
                      <GitBranch size={13} style={{ color: "var(--accent)" }} />
                      <span>Alternate path available</span>
                    </div>
                    <button
                      type="button"
                      className="reroute-btn"
                      onClick={() => onRerouteFlow(flow.id)}
                      title="Apply calculated alternate path"
                    >
                      <Zap size={12} />
                      Simulated Reroute
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
