import { motion } from "framer-motion";
import {
  Network,
  CheckCircle,
  Server,
  AlertOctagon,
  Bot,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useNetwork } from "../context/NetworkContext";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import StatusBadge from "../components/ui/StatusBadge";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const { networkState, topology, incidents } = useNetwork();

  const totalSystems = networkState?.totalSystems ?? 200;
  const activeSystems = networkState?.activeSystems ?? 200;
  const offlineSystems = networkState?.offlineSystems ?? 0;
  const networkHealth = networkState?.networkHealth ?? 100;

  const activeIncidents = incidents.filter((i) => i.status === "active");
  const nodes = topology?.nodes ?? [];
  const isHealthy = networkHealth >= 90;

  const cubicEase = [0.22, 1, 0.36, 1] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const fastItemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: cubicEase },
    },
  };

  const slowItemVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.52, ease: cubicEase },
    },
  };

  return (
    <motion.div
      className="dashboard-page-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 1. Page Heading Header */}
      <motion.div className="page-heading" variants={fastItemVariants}>
        <div>
          <p className="page-eyebrow">COMMAND CENTER</p>
          <h1>Network Operations Overview</h1>
          <p className="page-description">
            Real-time telemetry and infrastructure health across NetPilot X.
          </p>
        </div>

        <div className="network-header-actions">
          <StatusBadge
            status={isHealthy ? "live" : "critical"}
            label={isHealthy ? "NETWORK OPERATIONAL" : "INCIDENT CRITICAL"}
          />
        </div>
      </motion.div>

      {/* 2. Top Operational KPI Strip */}
      <motion.div className="kpi-grid" variants={containerVariants}>
        <motion.div className="kpi-card" variants={fastItemVariants}>
          <div className="kpi-header">
            <span className="kpi-title">NETWORK HEALTH</span>
            <Network size={18} className="kpi-icon text-cyan-400" />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={networkHealth} suffix="%" />
            </h2>
            <p className="kpi-subtext">Overall operational capacity</p>
          </div>
        </motion.div>

        <motion.div className="kpi-card" variants={fastItemVariants}>
          <div className="kpi-header">
            <span className="kpi-title">ACTIVE SYSTEMS</span>
            <CheckCircle size={18} className="kpi-icon text-emerald-400" />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={activeSystems} />
              <span className="kpi-total"> / {totalSystems}</span>
            </h2>
            <p className="kpi-subtext">Endpoints online</p>
          </div>
        </motion.div>

        <motion.div className="kpi-card" variants={fastItemVariants}>
          <div className="kpi-header">
            <span className="kpi-title">SYSTEMS OFFLINE</span>
            <Server size={18} className="kpi-icon text-amber-400" />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={offlineSystems} />
            </h2>
            <p className="kpi-subtext">Endpoints affected</p>
          </div>
        </motion.div>

        <motion.div className="kpi-card" variants={fastItemVariants}>
          <div className="kpi-header">
            <span className="kpi-title">OPEN INCIDENTS</span>
            <AlertOctagon size={18} className="kpi-icon text-rose-400" />
          </div>
          <div className="kpi-body">
            <h2 className="kpi-value">
              <AnimatedNumber value={activeIncidents.length} />
            </h2>
            <p className="kpi-subtext">Requires operator action</p>
          </div>
        </motion.div>
      </motion.div>

      {/* 3. Middle Grid: Network Capacity & AI Assistant Preview */}
      <motion.div className="dashboard-middle-grid" variants={containerVariants}>
        {/* Network Capacity Radial Overview */}
        <motion.section className="dashboard-panel health-ring-panel" variants={slowItemVariants}>
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">INFRASTRUCTURE CAPACITY</p>
              <h2>Health Ring Overview</h2>
            </div>
            <StatusBadge status={isHealthy ? "healthy" : "critical"} />
          </div>

          <div className="health-ring-container">
            <div className="radial-ring-wrapper">
              <svg className="radial-svg" viewBox="0 0 160 160">
                <circle
                  className="radial-bg"
                  cx="80"
                  cy="80"
                  r="65"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  className="radial-fill"
                  cx="80"
                  cy="80"
                  r="65"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="408"
                  strokeDashoffset={408 - (408 * networkHealth) / 100}
                  stroke={isHealthy ? "#00C8FF" : "#FF3B3B"}
                  strokeLinecap="round"
                />
              </svg>
              <div className="radial-content">
                <span className="radial-number">{networkHealth}%</span>
                <span className="radial-label">CAPACITY</span>
              </div>
            </div>

            <div className="health-stat-list">
              <div className="health-stat-item">
                <span className="health-dot online" />
                <div>
                  <strong>Active Endpoints</strong>
                  <span>{activeSystems} systems connected</span>
                </div>
              </div>

              <div className="health-stat-item">
                <span className="health-dot offline" />
                <div>
                  <strong>Offline Endpoints</strong>
                  <span>{offlineSystems} systems unreachable</span>
                </div>
              </div>

              <div className="health-stat-item">
                <span className="health-dot warning" />
                <div>
                  <strong>Monitored Switches</strong>
                  <span>{nodes.length} network nodes operational</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* AI Copilot Preview */}
        <motion.section className="dashboard-panel copilot-preview-panel" variants={slowItemVariants}>
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-cyan-400" />
              <div>
                <p className="panel-eyebrow">AUTONOMOUS ASSISTANT</p>
                <h2>AI NOC Copilot</h2>
              </div>
            </div>
            <span className="ai-status-tag">
              <Zap size={10} /> ONLINE
            </span>
          </div>

          <div className="copilot-preview-body">
            {activeIncidents.length > 0 ? (
              <div className="copilot-alert-box">
                <AlertOctagon size={22} className="text-rose-400 shrink-0" />
                <div>
                  <strong>Incident Detected: {activeIncidents[0].deviceName}</strong>
                  <p>
                    {activeIncidents[0].affectedSystems} endpoints offline due to link outage.
                    Recommended action: Inspect topology or initiate network recovery.
                  </p>
                </div>
              </div>
            ) : (
              <div className="copilot-healthy-box">
                <ShieldCheck size={22} className="text-emerald-400 shrink-0" />
                <div>
                  <strong>All Infrastructure Operational</strong>
                  <p>
                    Zero active failures detected across the 200 monitored endpoint systems.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              className="copilot-action-btn"
              onClick={() => navigate("/network")}
            >
              <span>OPEN TOPOLOGY WORKSPACE</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.section>
      </motion.div>

      {/* 4. Infrastructure Switch Status Grid */}
      <motion.section className="dashboard-panel" variants={slowItemVariants}>
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">INFRASTRUCTURE SWITCHES</p>
            <h2>Monitored Devices Status</h2>
          </div>
          <button
            type="button"
            className="btn-link-action"
            onClick={() => navigate("/network")}
          >
            Open Topology Workspace →
          </button>
        </div>

        <div className="dashboard-device-grid">
          {nodes.map((node) => (
            <motion.div
              key={node.id}
              className={`device-card-item ${node.status === "down" ? "critical" : ""}`}
              onClick={() => navigate(`/network?device=${node.id}`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="device-card-header">
                <StatusBadge status={node.status} />
                <span className="device-id-tag">{node.id}</span>
              </div>
              <strong className="device-name">{node.name}</strong>
              <span className="device-type">{node.type.toUpperCase()} SWITCH</span>
              {node.connectedSystems !== undefined && (
                <span className="device-systems-count">
                  {node.connectedSystems} connected endpoints
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}