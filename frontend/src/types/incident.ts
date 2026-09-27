export type IncidentStatus =
  | "active"
  | "resolved";

export type IncidentSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;

  deviceId: string;
  deviceName: string;

  affectedSystems: number;

  detectedAt: string;
  resolvedAt?: string;

  rootCause?: string;
}