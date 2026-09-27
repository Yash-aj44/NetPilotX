export type DeviceType =
  | "core"
  | "distribution"
  | "edge"
  | "workstation"
  | "server"
  | "printer"
  | "iot"
  | "management";

export type DeviceStatus = "up" | "down" | "degraded" | "unknown";

export type LinkStatus = "up" | "down" | "degraded";

export interface NetworkNode {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ip?: string;
  mac?: string;
  parentId?: string;
  connectedSystems?: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  status: LinkStatus;
  latency?: number;
  packetLoss?: number;
}

export interface NetworkTopology {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface NetworkDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ip?: string;
  mac?: string;
  cpu?: number;
  memory?: number;
  latency?: number;
  packetLoss?: number;
}

export interface NetworkState {
  totalSystems: number;
  activeSystems: number;
  offlineSystems: number;
  networkHealth: number;
  devices: NetworkDevice[];
  topology: NetworkTopology;
}