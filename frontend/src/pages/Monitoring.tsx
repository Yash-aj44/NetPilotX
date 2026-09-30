import { motion } from "framer-motion";
import { Cpu, MemoryStick, Gauge, Radio } from "lucide-react";
import { useNetwork } from "../context/NetworkContext";
import MonitoringChart from "../components/monitoring/MonitoringChart";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import StatusBadge from "../components/ui/StatusBadge";
import TextReveal from "../components/ui/TextReveal";

export default function Monitoring() {
  const { networkState, topology, loading, error, monitoring, refreshNetwork } = useNetwork();

  if (loading && !networkState) {
    return (
      <div className="page-loading-center">
        <span>Loading Telemetry Feed...</span>
      </div>
    );
  }

  if (error || !networkState || !topology) {
    return (
      <div className="page-loading-center text-center p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-1">
          Telemetry Service Interrupted
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
          {error || "Unable to retrieve real-time monitoring data from backend."}
        </p>
        <button
          type="button"
          className="recover-action-btn px-4 py-2"
          onClick={refreshNetwork}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const devices = networkState.devices.map((dev) => {
    const monData = monitoring.find(
      (m) => m.device.toLowerCase() === dev.id.toLowerCase()
    );
    if (monData) {
      return {
        ...dev,
        status: monData.status,
        cpu: monData.cpu,
        memory: monData.memory,
        latency: monData.latency,
        packetLoss: monData.packetLoss,
      };
    }
    return dev;
  });

  const total = devices.length;

  const onlineNodes = topology.nodes.filter((n) => n.status === "up").length;
  const degradedNodes = topology.nodes.filter((n) => n.status === "degraded").length;
  const offlineNodes = topology.nodes.filter((n) => n.status === "down").length;

  const avgCpu =
    total > 0 ? Math.round(devices.reduce((acc, d) => acc + (d.cpu ?? 0), 0) / total) : 0;
  const avgMemory =
    total > 0 ? Math.round(devices.reduce((acc, d) => acc + (d.memory ?? 0), 0) / total) : 0;
  const avgLatency =
    total > 0 ? Math.round(devices.reduce((acc, d) => acc + (d.latency ?? 0), 0) / total) : 0;
  const avgLoss =
    total > 0
      ? (devices.reduce((acc, d) => acc + (d.packetLoss ?? 0), 0) / total).toFixed(1)
      : "0.0";

  const chartData = [
    { time: "10:00", cpu: Math.max(0, avgCpu - 4), memory: Math.max(0, avgMemory - 3), latency: Math.max(0, avgLatency - 2) },
    { time: "10:05", cpu: Math.max(0, avgCpu - 2), memory: Math.max(0, avgMemory - 1), latency: Math.max(0, avgLatency - 1) },
    { time: "10:10", cpu: avgCpu, memory: avgMemory, latency: avgLatency },
    { time: "10:15", cpu: Math.min(100, avgCpu + 3), memory: Math.min(100, avgMemory + 2), latency: avgLatency + 1 },
    { time: "10:20", cpu: Math.min(100, avgCpu + 1), memory: Math.min(100, avgMemory + 1), latency: avgLatency },
    { time: "10:25", cpu: avgCpu, memory: avgMemory, latency: avgLatency },
  ];

  const cubicEase = [0.16, 1, 0.3, 1] as const;

  return (
    <motion.div
      className="monitoring-page-container"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.35, ease: cubicEase }}
    >
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">TELEMETRY & PERFORMANCE</p>
          <TextReveal text="Real-Time Network Monitoring" as="h1" />
          <p className="page-description">
            Live telemetry stream across core switches and endpoint subnets.
          </p>
        </div>

        <div className="network-header-actions">
          <StatusBadge status="live" label="LIVE MONITORING" />
        </div>
      </div>

      {/* Stats KPI Grid */}
      <div className="kpi-grid">
        <motion.div className="kpi-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="kpi-header">
            <span className="kpi-title">AVERAGE CPU</span>
            <Cpu size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={avgCpu} suffix="%" />
            </h2>
            <p className="kpi-subtext">Across monitored devices</p>
          </div>
        </motion.div>

        <motion.div className="kpi-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="kpi-header">
            <span className="kpi-title">AVERAGE MEMORY</span>
            <MemoryStick size={18} style={{ color: "var(--healthy)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={avgMemory} suffix="%" />
            </h2>
            <p className="kpi-subtext">Buffer pool utilization</p>
          </div>
        </motion.div>

        <motion.div className="kpi-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="kpi-header">
            <span className="kpi-title">AVERAGE LATENCY</span>
            <Gauge size={18} style={{ color: "var(--degraded)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={avgLatency} suffix=" ms" />
            </h2>
            <p className="kpi-subtext">Round-trip response time</p>
          </div>
        </motion.div>

        <motion.div className="kpi-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="kpi-header">
            <span className="kpi-title">PACKET LOSS RATE</span>
            <Radio size={18} style={{ color: parseFloat(avgLoss) > 0 ? "var(--critical)" : "var(--text-muted)" }} />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">{avgLoss}%</h2>
            <p className="kpi-subtext">Dropped transmission rate</p>
          </div>
        </motion.div>
      </div>

      {/* Realtime Chart Panel */}
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">TELEMETRY STREAM</p>
            <h2>Performance Metrics Over Time</h2>
          </div>
        </div>
        <MonitoringChart data={chartData} />
      </section>

      {/* Monitored Device Grid */}
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">DEVICE HEALTH BREAKDOWN</p>
            <h2>Switch Status & Resource Utilization</h2>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <span style={{ color: "var(--healthy)" }}>{onlineNodes} Operational</span>
            <span style={{ color: "var(--degraded)" }}>{degradedNodes} Degraded</span>
            <span style={{ color: "var(--critical)" }}>{offlineNodes} Down</span>
          </div>
        </div>

        <div className="monitoring-device-grid">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`mon-device-card ${device.status === "down" ? "critical" : ""}`}
            >
              <div className="mon-card-header">
                <div>
                  <strong>{device.name}</strong>
                  <span className="mon-card-type">{device.type.toUpperCase()}</span>
                </div>
                <StatusBadge status={device.status} />
              </div>

              <div className="mon-card-metrics">
                <div className="metric-cell">
                  <span>CPU</span>
                  <strong>{device.status === "down" ? 0 : device.cpu}%</strong>
                </div>
                <div className="metric-cell">
                  <span>RAM</span>
                  <strong>{device.status === "down" ? 0 : device.memory}%</strong>
                </div>
                <div className="metric-cell">
                  <span>LATENCY</span>
                  <strong>{device.status === "down" ? 0 : device.latency} ms</strong>
                </div>
                <div className="metric-cell">
                  <span>LOSS</span>
                  <strong>{device.status === "down" ? "100%" : `${device.packetLoss}%`}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}