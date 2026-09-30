import { useState } from "react";
import { Bell, ShieldAlert, AlertTriangle, CheckCircle } from "lucide-react";
import { useNetwork } from "../context/NetworkContext";
import StatusBadge from "../components/ui/StatusBadge";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import TextReveal from "../components/ui/TextReveal";

export default function Alerts() {
  const { alerts } = useNetwork();
  const [filter, setFilter] = useState<"all" | "critical" | "warning">("all");

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  const filteredAlerts = alerts.filter((item) => {
    if (filter === "critical") return item.severity === "critical";
    if (filter === "warning") return item.severity === "warning";
    return true;
  });

  return (
    <div className="alerts-page-container">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">EVENT MANAGEMENT</p>
          <TextReveal text="Alert Feed" as="h1" />
          <p className="page-description">
            Real-time event log and alert notification management.
          </p>
        </div>

        <div className="network-header-actions">
          <StatusBadge status="live" label="ALERT FEED ACTIVE" />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">TOTAL ALERTS</span>
            <Bell size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={alerts.length} />
            </h2>
            <p className="kpi-subtext">Session alert events</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">CRITICAL</span>
            <ShieldAlert size={18} style={{ color: criticalCount > 0 ? "var(--critical)" : "var(--text-muted)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={criticalCount} />
            </h2>
            <p className="kpi-subtext">Requires immediate action</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">WARNINGS</span>
            <AlertTriangle size={18} style={{ color: warningCount > 0 ? "var(--degraded)" : "var(--text-muted)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={warningCount} />
            </h2>
            <p className="kpi-subtext">Cascaded endpoint warnings</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">OPERATIONAL</span>
            <CheckCircle size={18} style={{ color: "var(--healthy)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={alerts.length === 0 ? 1 : 0} />
            </h2>
            <p className="kpi-subtext">Normal operations</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Alert Feed */}
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">LIVE EVENT STREAM</p>
            <h2>System Alerts</h2>
          </div>

          <div className="filter-pill-tabs">
            <button
              type="button"
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({alerts.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${filter === "critical" ? "active" : ""}`}
              onClick={() => setFilter("critical")}
            >
              Critical ({criticalCount})
            </button>
            <button
              type="button"
              className={`filter-btn ${filter === "warning" ? "active" : ""}`}
              onClick={() => setFilter("warning")}
            >
              Warnings ({warningCount})
            </button>
          </div>
        </div>

        <div className="alert-feed-list">
          {filteredAlerts.length === 0 ? (
            <div className="empty-alert-state">No active alerts from backend.</div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`alert-feed-item ${alert.severity === "critical" ? "critical" : ""}`}
              >
                <div className="alert-icon-wrapper">
                  {alert.severity === "critical" ? (
                    <ShieldAlert size={18} style={{ color: "var(--critical)" }} />
                  ) : alert.severity === "warning" ? (
                    <AlertTriangle size={18} style={{ color: "var(--degraded)" }} />
                  ) : (
                    <Bell size={18} style={{ color: "var(--accent)" }} />
                  )}
                </div>

                <div className="alert-content">
                  <div className="alert-title-bar">
                    <strong>{alert.title}</strong>
                    <StatusBadge
                      status={
                        alert.severity === "critical"
                          ? "critical"
                          : alert.severity === "warning"
                          ? "degraded"
                          : "live"
                      }
                      label={alert.severity.toUpperCase()}
                    />
                  </div>

                  <p className="alert-msg">{alert.message}</p>

                  <div className="alert-meta-bar">
                    <span className="font-mono" style={{ color: "var(--accent)" }}>{alert.id}</span>
                    <span>Device: {alert.device}</span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}