import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownUp,
  Cpu,
  GitBranch,
  Layers,
  Radio,
} from "lucide-react";
import type { TrafficKpis } from "../../types/traffic";
import AnimatedNumber from "../ui/AnimatedNumber";

interface TrafficKpiCardsProps {
  kpis: TrafficKpis;
}

export default function TrafficKpiCards({ kpis }: TrafficKpiCardsProps) {
  const cubicEase = [0.16, 1, 0.3, 1] as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: cubicEase },
    },
  };

  return (
    <div className="traffic-kpi-grid">
      {/* 1. Traffic Demand */}
      <motion.div
        className="kpi-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="kpi-header">
          <span className="kpi-title">TRAFFIC DEMAND</span>
          <ArrowDownUp size={15} style={{ color: "var(--accent)" }} />
        </div>
        <div className="kpi-body">
          <h2 className="kpi-value font-mono">
            {kpis.trafficDemandGbps.toFixed(2)} Gbps
          </h2>
          <p className="kpi-subtext">Total ingress request volume</p>
        </div>
      </motion.div>

      {/* 2. Delivered Traffic */}
      <motion.div
        className="kpi-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.04 }}
      >
        <div className="kpi-header">
          <span className="kpi-title">DELIVERED</span>
          <Activity size={15} style={{ color: "var(--healthy)" }} />
        </div>
        <div className="kpi-body">
          <h2 className="kpi-value font-mono">
            {kpis.deliveredGbps.toFixed(2)} Gbps
          </h2>
          <p className="kpi-subtext">Throughput successfully delivered</p>
        </div>
      </motion.div>

      {/* 3. Utilization */}
      <motion.div
        className={`kpi-card ${kpis.networkUtilizationPercent >= 80 ? "critical-card" : ""}`}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.08 }}
      >
        <div className="kpi-header">
          <span className="kpi-title">UTILIZATION</span>
          <Cpu
            size={15}
            style={{
              color:
                kpis.networkUtilizationPercent >= 80
                  ? "var(--critical)"
                  : kpis.networkUtilizationPercent >= 65
                  ? "var(--degraded)"
                  : "var(--healthy)",
            }}
          />
        </div>
        <div className="kpi-body">
          <h2
            className="kpi-value"
            style={{
              color:
                kpis.networkUtilizationPercent >= 80
                  ? "var(--critical)"
                  : undefined,
            }}
          >
            <AnimatedNumber
              value={kpis.networkUtilizationPercent}
              suffix="%"
            />
          </h2>
          <p className="kpi-subtext">Avg link bandwidth consumption</p>
        </div>
      </motion.div>

      {/* 4. Packet Loss */}
      <motion.div
        className="kpi-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.12 }}
      >
        <div className="kpi-header">
          <span className="kpi-title">PACKET LOSS</span>
          <Radio
            size={15}
            style={{
              color:
                kpis.packetLossPercent > 1
                  ? "var(--critical)"
                  : "var(--text-muted)",
            }}
          />
        </div>
        <div className="kpi-body">
          <h2
            className="kpi-value font-mono"
            style={{
              color:
                kpis.packetLossPercent > 1
                  ? "var(--critical)"
                  : undefined,
            }}
          >
            {kpis.packetLossPercent.toFixed(1)}%
          </h2>
          <p className="kpi-subtext">Congestion & drop rate</p>
        </div>
      </motion.div>

      {/* 5. Active Flows */}
      <motion.div
        className="kpi-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.16 }}
      >
        <div className="kpi-header">
          <span className="kpi-title">ACTIVE FLOWS</span>
          <Layers size={15} style={{ color: "var(--accent)" }} />
        </div>
        <div className="kpi-body">
          <h2 className="kpi-value">
            <AnimatedNumber value={kpis.activeFlows} />
          </h2>
          <p className="kpi-subtext">Monitored traffic streams</p>
        </div>
      </motion.div>

      {/* 6. Rerouted Flows */}
      <motion.div
        className={`kpi-card ${kpis.reroutedFlows > 0 ? "highlight-card" : ""}`}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <div className="kpi-header">
          <span className="kpi-title">REROUTED</span>
          <GitBranch
            size={15}
            style={{
              color:
                kpis.reroutedFlows > 0
                  ? "var(--accent)"
                  : "var(--text-muted)",
            }}
          />
        </div>
        <div className="kpi-body">
          <h2
            className="kpi-value"
            style={{
              color:
                kpis.reroutedFlows > 0 ? "var(--accent)" : undefined,
            }}
          >
            <AnimatedNumber value={kpis.reroutedFlows} />
          </h2>
          <p className="kpi-subtext">Alternate paths active</p>
        </div>
      </motion.div>
    </div>
  );
}
