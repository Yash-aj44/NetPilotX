import { AlertOctagon, CheckCircle, Clock3, Search } from "lucide-react";
import { useNetwork } from "../context/NetworkContext";
import StatusBadge from "../components/ui/StatusBadge";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import TextReveal from "../components/ui/TextReveal";

export default function Incidents() {
  const { failureAlert, topology, incidents, recoverNetwork } = useNetwork();

  const activeIncidents = incidents.filter((i) => i.status === "active");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  const activeIncident = activeIncidents[0] ?? null;
  const hasActive = activeIncident !== null && failureAlert !== null;

  const failedNode = failureAlert
    ? topology?.nodes.find((n) => n.id === failureAlert.deviceId)
    : null;

  const parentDevice = failedNode?.parentId ?? "CORE-01";

  return (
    <div className="incidents-page-container">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">INCIDENT MANAGEMENT</p>
          <TextReveal text="Incident Command Center" as="h1" />
          <p className="page-description">
            Investigate active network failures, dependency chains, and resolution logs.
          </p>
        </div>

        <div className="network-header-actions">
          <StatusBadge status={hasActive ? "critical" : "live"} />
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">OPEN INCIDENTS</span>
            <AlertOctagon size={18} style={{ color: activeIncidents.length > 0 ? "var(--critical)" : "var(--text-muted)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={activeIncidents.length} />
            </h2>
            <p className="kpi-subtext">Currently open failure tickets</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">INVESTIGATING</span>
            <Search size={18} style={{ color: activeIncidents.length > 0 ? "var(--degraded)" : "var(--text-muted)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={activeIncidents.length > 0 ? 1 : 0} />
            </h2>
            <p className="kpi-subtext">Under active root cause analysis</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">CRITICAL SEVERITY</span>
            <AlertOctagon size={18} style={{ color: activeIncidents.length > 0 ? "var(--critical)" : "var(--text-muted)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={activeIncidents.length} />
            </h2>
            <p className="kpi-subtext">High impact network issues</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">RESOLVED INCIDENTS</span>
            <CheckCircle size={18} style={{ color: "var(--healthy)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={resolvedIncidents.length} />
            </h2>
            <p className="kpi-subtext">Restored session incidents</p>
          </div>
        </div>
      </div>

      {/* Active Incident Section */}
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">ACTIVE INCIDENT QUEUE</p>
            <h2>Current Incident Details</h2>
          </div>
        </div>

        {hasActive && activeIncident && failureAlert ? (
          <div className="active-incident-card-body">
            <div className="incident-card-top">
              <div>
                <span className="incident-id-badge">{activeIncident.id}</span>
                <h3 className="incident-title">
                  {activeIncident.deviceName} Uplink Interruption
                </h3>
                <p className="incident-sub">
                  {activeIncident.affectedSystems} endpoint systems disconnected
                </p>
              </div>
              <div className="incident-badges flex gap-2">
                <StatusBadge status="critical" label="CRITICAL" />
                <StatusBadge status="degraded" label="OPEN" />
              </div>
            </div>

            <div className="incident-detail-blocks">
              <div className="detail-block">
                <span className="block-title">ROOT CAUSE ANALYSIS</span>
                <div className="root-cause-banner">
                  <strong>Simulated Device Down</strong>
                  <p>
                    {activeIncident.deviceName} changed status to DOWN. Link connectivity to{" "}
                    {parentDevice} broken.
                  </p>
                </div>
              </div>

              <div className="detail-block">
                <span className="block-title">DEPENDENCY CHAIN</span>
                <div className="dependency-chain">
                  <span className="node-chip healthy">{parentDevice}</span>
                  <span className="arrow" style={{ color: "var(--critical)" }}>⚡ LINK DOWN</span>
                  <span className="node-chip failed">{activeIncident.deviceName}</span>
                  <span className="arrow">→</span>
                  <span className="node-chip affected">
                    {activeIncident.affectedSystems} Endpoints
                  </span>
                </div>
              </div>
            </div>

            <div className="incident-action-footer">
              <button
                type="button"
                className="recover-action-btn"
                onClick={recoverNetwork}
              >
                Initiate Network Recovery
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-incident-state">
            <CheckCircle size={32} style={{ color: "var(--healthy)" }} />
            <h3>No Active Network Incidents</h3>
            <p>All monitored infrastructure systems are operating normally.</p>
          </div>
        )}
      </section>

      {/* Resolved Incidents Table */}
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">INCIDENT HISTORY</p>
            <h2>Resolved Incident Log</h2>
          </div>
          <span className="count-badge">{resolvedIncidents.length} Resolved</span>
        </div>

        {resolvedIncidents.length === 0 ? (
          <div className="empty-history-state">
            <Clock3 size={24} className="text-muted" />
            <p>Resolved incidents in this session will be logged here.</p>
          </div>
        ) : (
          <div className="history-table">
            <div className="table-header-row">
              <span>INCIDENT ID</span>
              <span>DEVICE</span>
              <span>AFFECTED</span>
              <span>DETECTED AT</span>
              <span>RESOLVED AT</span>
              <span>STATUS</span>
            </div>
            {resolvedIncidents.map((inc) => (
              <div className="table-data-row" key={inc.id}>
                <span className="font-mono" style={{ color: "var(--accent)" }}>{inc.id}</span>
                <strong>{inc.deviceName}</strong>
                <span>{inc.affectedSystems} Systems</span>
                <span className="text-muted">{new Date(inc.detectedAt).toLocaleTimeString()}</span>
                <span className="text-muted">
                  {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleTimeString() : "-"}
                </span>
                <StatusBadge status="up" label="RESOLVED" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}