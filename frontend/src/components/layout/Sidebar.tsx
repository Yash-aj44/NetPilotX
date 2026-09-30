import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Network,
  Activity,
  Waypoints,
  AlertTriangle,
  Bell,
  Bot,
  Settings,
  UserCheck,
  Zap,
} from "lucide-react";
import { useNetwork } from "../../context/NetworkContext";

interface SidebarProps {
  onOpenCopilot?: () => void;
  copilotOpen?: boolean;
}

export default function Sidebar({ onOpenCopilot, copilotOpen }: SidebarProps) {
  const { networkState, incidents } = useNetwork();

  const activeIncidentsCount = incidents.filter((i) => i.status === "active").length;
  const isHealthy = (networkState?.networkHealth ?? 100) >= 90;

  const mainNav = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Network",
      path: "/network",
      icon: Network,
    },
    {
      name: "Monitoring",
      path: "/monitoring",
      icon: Activity,
    },
    {
      name: "Traffic",
      path: "/traffic",
      icon: Waypoints,
    },
    {
      name: "Incidents",
      path: "/incidents",
      icon: AlertTriangle,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
    },
    {
      name: "Alerts",
      path: "/alerts",
      icon: Bell,
    },
  ];

  const cubicEase = [0.22, 1, 0.36, 1] as const;

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: cubicEase }}
    >
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-mark">
          <Network size={22} className="brand-icon" />
        </div>
        <div className="brand-text">
          <h2>NetPilot X</h2>
          <span className="brand-subtitle">AI NETWORK OPS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-title">MAIN NAVIGATION</p>

        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className="sidebar-link-icon" />
                  <span className="sidebar-link-text">{item.name}</span>
                  {item.badge !== undefined && (
                    <span className="sidebar-badge-count">{item.badge}</span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="active-nav-glow"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* AI Copilot Direct Action */}
        <button
          type="button"
          onClick={onOpenCopilot}
          className={`sidebar-link copilot-sidebar-btn ${copilotOpen ? "active" : ""}`}
        >
          <Bot size={18} className="sidebar-link-icon text-cyan-400" />
          <span className="sidebar-link-text">AI Copilot</span>
          <span className="copilot-pulse-badge">
            <Zap size={10} /> AI
          </span>
        </button>

        <p className="sidebar-section-title" style={{ marginTop: "24px" }}>
          SYSTEM
        </p>

        <div className="sidebar-link disabled-link">
          <Settings size={18} className="sidebar-link-icon" />
          <span className="sidebar-link-text">Settings</span>
        </div>

        <div className="sidebar-link disabled-link">
          <UserCheck size={18} className="sidebar-link-icon" />
          <span className="sidebar-link-text">Admin</span>
        </div>
      </nav>

      {/* Simulation Footer */}
      <div className="sidebar-footer">
        <div className="simulation-status">
          <span className={`status-dot ${isHealthy ? "pulse" : "critical"}`} />
          <div className="simulation-info">
            <strong>
              {isHealthy ? "Simulation Online" : "Degraded State"}
            </strong>
            <span>
              {networkState?.totalSystems ?? 200} Systems Monitored
            </span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}