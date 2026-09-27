import { useState } from "react";
import { Bell, ShieldAlert, AlertTriangle, CheckCircle } from "lucide-react";
import { useNetwork } from "../context/NetworkContext";
import StatusBadge from "../components/ui/StatusBadge";
import AnimatedNumber from "../components/ui/AnimatedNumber";

export default function Alerts() {
  const { failureAlert, incidents } = useNetwork();
  const [filter, setFilter] = useState<"all" | "critical" | "info">("all");

  const activeCount = failureAlert ? 1 : 0;
  const criticalCount = activeCount;

  const alertItems = [
    ...(failureAlert
      ? [
          {
            id: "ALT-CRIT-01",
            severity: "critical",
            title: `CRITICAL ALERT: ${failureAlert.deviceName} Unreachable`,
            message: `${failureAlert.affectedSystems} endpoint systems disconnected due to uplink failure.`,
            time: "Just now",
            device: failureAlert.deviceName,
          },
        ]
      : []),
    {
      id: "ALT-INFO-01",
      severity: "info",
      title: "Simulation Stream Active",
      message: "Monitored telemetry stream active for 200 endpoints.",
      time: "Session active",
      device: "NetPilot Engine",
    },
    ...incidents
      .filter((i) => i.status === "resolved")
      .map((inc) => ({
        id: `ALT-RES-${inc.id}`,
        severity: "info",
        title: `RESOLVED: ${inc.deviceName} Restored`,
        message: `${inc.affectedSystems} endpoints successfully reconnected.`,
        time: inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleTimeString() : "Earlier",
        device: inc.deviceName,
      })),
  ];

  const filteredAlerts = alertItems.filter((item) => {
    if (filter === "critical") return item.severity === "critical";
    if (filter === "info") return item.severity === "info";
    return true;
  });

  return (
    <div className="alerts-page-container">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">EVENT MANAGEMENT</p>
          <h1>Alert Feed</h1>
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
            <Bell size={20} className="kpi-icon text-cyan-400" />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={alertItems.length} />
            </h2>
            <p className="kpi-subtext">Session alert events</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">CRITICAL</span>
            <ShieldAlert size={20} className="kpi-icon text-rose-400" />
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
            <AlertTriangle size={20} className="kpi-icon text-amber-400" />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">0</h2>
            <p className="kpi-subtext">Under investigation</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">RESOLVED</span>
            <CheckCircle size={20} className="kpi-icon text-emerald-400" />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={incidents.filter((i) => i.status === "resolved").length} />
            </h2>
            <p className="kpi-subtext">Handled events</p>
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
              All ({alertItems.length})
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
              className={`filter-btn ${filter === "info" ? "active" : ""}`}
              onClick={() => setFilter("info")}
            >
              Informational ({alertItems.length - criticalCount})
            </button>
          </div>
        </div>

        <div className="alert-feed-list">
          {filteredAlerts.length === 0 ? (
            <div className="empty-alert-state">No alerts in this view category.</div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`alert-feed-item ${alert.severity === "critical" ? "critical" : ""}`}
              >
                <div className="alert-icon-wrapper">
                  {alert.severity === "critical" ? (
                    <ShieldAlert size={20} className="text-rose-400" />
                  ) : (
                    <Bell size={20} className="text-cyan-400" />
                  )}
                </div>

                <div className="alert-content">
                  <div className="alert-title-bar">
                    <strong>{alert.title}</strong>
                    <StatusBadge
                      status={alert.severity === "critical" ? "critical" : "live"}
                      label={alert.severity.toUpperCase()}
                    />
                  </div>

                  <p className="alert-msg">{alert.message}</p>

                  <div className="alert-meta-bar">
                    <span className="font-mono text-cyan-400">{alert.id}</span>
                    <span>Device: {alert.device}</span>
                    <span>{alert.time}</span>
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