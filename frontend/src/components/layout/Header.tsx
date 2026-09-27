import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, CircleUserRound, LogOut, Bot } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNetwork } from "../../context/NetworkContext";
import ThemeToggle from "../ui/ThemeToggle";
import SearchInput from "../ui/SearchInput";
import StatusBadge from "../ui/StatusBadge";

interface HeaderProps {
  onToggleCopilot?: () => void;
}

export default function Header({ onToggleCopilot }: HeaderProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { networkState, incidents } = useNetwork();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const activeIncidents = incidents.filter((i) => i.status === "active");
  const hasActiveIncidents = activeIncidents.length > 0;
  const health = networkState?.networkHealth ?? 100;

  // Breadcrumb route title mapping
  const routeTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/network": "Network Topology",
    "/monitoring": "Monitoring & Telemetry",
    "/incidents": "Incident Management",
    "/alerts": "Alert Feed",
  };

  const currentTitle = routeTitles[location.pathname] || "Network Operations Center";
  const cubicEase = [0.22, 1, 0.36, 1] as const;

  return (
    <motion.header
      className="app-header"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: cubicEase }}
    >
      <div className="header-left">
        <div className="header-breadcrumbs">
          <span className="breadcrumb-root">NETWORK OPERATIONS</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{currentTitle}</span>
        </div>

        <StatusBadge
          status={hasActiveIncidents ? "critical" : health < 90 ? "degraded" : "live"}
          label={hasActiveIncidents ? "INCIDENT ACTIVE" : "SIMULATION ONLINE"}
        />
      </div>

      <div className="header-right">
        {/* Global Search */}
        <SearchInput />

        {/* Theme Switcher */}
        <ThemeToggle />

        {/* AI Copilot Quick Trigger */}
        <button
          type="button"
          className="header-icon-btn copilot-quick-btn"
          onClick={onToggleCopilot}
          title="Open AI Copilot"
        >
          <Bot size={18} />
        </button>

        {/* Notifications Icon */}
        <button
          type="button"
          className="header-icon-btn"
          title="Notifications"
        >
          <Bell size={18} />
          {hasActiveIncidents && <span className="notification-dot pulse" />}
        </button>

        {/* Admin Profile */}
        <div className="header-user-wrapper">
          <button
            type="button"
            className="user-profile-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              <CircleUserRound size={20} />
            </div>
            <div className="user-details">
              <strong>{user?.name || "Network Operator"}</strong>
              <span>{user?.role || "Administrator"}</span>
            </div>
          </button>

          {showUserMenu && (
            <div className="user-dropdown-menu">
              <div className="user-dropdown-header">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item text-danger"
                onClick={logout}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}