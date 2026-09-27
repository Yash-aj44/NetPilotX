export type AlertSeverity = "info" | "warning" | "critical";

export type AlertStatus = "active" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  device?: string;
  deviceId?: string;
  timestamp: string;
  status: AlertStatus;
  affectedSystems?: number;
}