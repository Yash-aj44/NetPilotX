export type LinkTrafficStatus =
  | "normal"
  | "moderate"
  | "high"
  | "congested"
  | "down";

export type FlowStatus =
  | "normal"
  | "moderate"
  | "high"
  | "congested"
  | "rerouted"
  | "degraded";

export interface TrafficLinkData {
  id: string;
  source: string;
  target: string;
  sourceName: string;
  targetName: string;
  capacityMbps: number;
  throughputMbps: number;
  utilizationPercent: number;
  packetsPerSec: number;
  packetLossPercent: number;
  activeFlowsCount: number;
  affectedFlowsCount: number;
  status: LinkTrafficStatus;
  isSimulatedCongestion?: boolean;
}

export interface TrafficFlow {
  id: string;
  name: string;
  source: string;
  destination: string;
  sourceName: string;
  destinationName: string;
  throughputMbps: number;
  packetsPerSec: number;
  path: string[]; // node IDs: e.g. ["edge-04", "dist-02", "edge-06"]
  alternatePath?: string[]; // calculated alternate path
  status: FlowStatus;
  isRerouted?: boolean;
  protocol: "TCP" | "UDP" | "HTTPS" | "BGP";
  priority: "High" | "Normal" | "Bulk";
  affectedByLink?: string;
}

export interface TrafficKpis {
  trafficDemandGbps: number;
  deliveredGbps: number;
  networkUtilizationPercent: number;
  packetLossPercent: number;
  activeFlows: number;
  reroutedFlows: number;
}

export interface TrafficHistoryPoint {
  time: string;
  demandGbps: number;
  deliveredGbps: number;
  utilizationPercent: number;
}

export interface TrafficSimulationState {
  links: TrafficLinkData[];
  flows: TrafficFlow[];
  kpis: TrafficKpis;
  history: TrafficHistoryPoint[];
  selectedFlowId: string | null;
  selectedLinkId: string | null;
  activeCongestionLinkId: string | null;
  lastReroutedFlowId: string | null;
  simulationStatus: "online" | "congested" | "rerouting" | "recovered";
}
