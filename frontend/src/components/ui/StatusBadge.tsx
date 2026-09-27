export type StatusType =
  | "healthy"
  | "operational"
  | "up"
  | "degraded"
  | "critical"
  | "down"
  | "recovering"
  | "info"
  | "live";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  label,
  pulse = true,
  className = "",
}: StatusBadgeProps) {
  const normStatus = (status || "healthy").toLowerCase();

  let colorClass = "status-badge-healthy";
  if (normStatus === "degraded" || normStatus === "warning") {
    colorClass = "status-badge-degraded";
  } else if (normStatus === "critical" || normStatus === "down") {
    colorClass = "status-badge-critical";
  } else if (normStatus === "recovering" || normStatus === "info") {
    colorClass = "status-badge-recovering";
  } else if (normStatus === "live" || normStatus === "operational" || normStatus === "up") {
    colorClass = "status-badge-healthy";
  }

  const textLabel = label || status.toUpperCase();

  return (
    <span className={`status-badge ${colorClass} ${className}`}>
      <span className={`status-dot ${pulse ? "pulse" : ""}`} />
      <span>{textLabel}</span>
    </span>
  );
}
