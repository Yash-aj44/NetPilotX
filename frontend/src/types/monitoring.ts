export interface DeviceMetric {
  deviceId: string;
  deviceName: string;
  cpu: number;
  memory: number;
  latency: number;
  packetLoss: number;
  uptime: number;
  status: "up" | "down" | "degraded" | "unknown";
  timestamp: string;
}

export interface MonitoringSummary {
  totalDevices: number;
  activeDevices: number;
  degradedDevices: number;
  offlineDevices: number;
  averageLatency: number;
  averagePacketLoss: number;
  networkHealth: number;
}

export interface MonitoringData {
  summary: MonitoringSummary;
  metrics: DeviceMetric[];
}