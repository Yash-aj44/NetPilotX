import type { NetworkEdge, NetworkNode } from "../types/network";
import type {
  FlowStatus,
  LinkTrafficStatus,
  TrafficFlow,
  TrafficHistoryPoint,
  TrafficKpis,
  TrafficLinkData,
  TrafficSimulationState,
} from "../types/traffic";

/**
 * Standard node adjacency graph built from real topology edges
 */
export function buildAdjacencyList(edges: NetworkEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    if (!adj.has(edge.target)) adj.set(edge.target, []);

    adj.get(edge.source)!.push(edge.target);
    adj.get(edge.target)!.push(edge.source);
  });

  return adj;
}

/**
 * Breadth-First Search (BFS) to find the shortest hop path on the topology
 */
export function findTopologyPath(
  sourceId: string,
  targetId: string,
  edges: NetworkEdge[],
  excludedEdgeId?: string
): string[] | null {
  if (sourceId === targetId) return [sourceId];

  const adj = new Map<string, Array<{ neighbor: string; linkId: string }>>();

  edges.forEach((edge) => {
    if (excludedEdgeId && edge.id === excludedEdgeId) return;

    if (!adj.has(edge.source)) adj.set(edge.source, []);
    if (!adj.has(edge.target)) adj.set(edge.target, []);

    adj.get(edge.source)!.push({ neighbor: edge.target, linkId: edge.id });
    adj.get(edge.target)!.push({ neighbor: edge.source, linkId: edge.id });
  });

  const queue: string[][] = [[sourceId]];
  const visited = new Set<string>([sourceId]);

  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const currentNode = currentPath[currentPath.length - 1];

    if (currentNode === targetId) {
      return currentPath;
    }

    const neighbors = adj.get(currentNode) || [];
    for (const { neighbor } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...currentPath, neighbor]);
      }
    }
  }

  return null;
}

/**
 * Helper to get link ID between two adjacent nodes
 */
export function getLinkIdBetweenNodes(nodeA: string, nodeB: string): string {
  const [a, b] = [nodeA.toLowerCase(), nodeB.toLowerCase()].sort();
  return `${a}-${b}`;
}

/**
 * Format device/node names (e.g. "dist-02" -> "DIST-02")
 */
export function formatDeviceName(id: string): string {
  return id.toUpperCase();
}

/**
 * Calculate link traffic status based on utilization thresholds
 */
export function getLinkStatusFromUtilization(
  utilization: number,
  isDown: boolean = false
): LinkTrafficStatus {
  if (isDown) return "down";
  if (utilization >= 90) return "congested";
  if (utilization >= 70) return "high";
  if (utilization >= 40) return "moderate";
  return "normal";
}

/**
 * Default Link Telemetry Profiles (Deterministic initial state)
 */
const BASE_LINK_METRICS: Record<
  string,
  {
    capacityMbps: number;
    utilizationPercent: number;
    pps: number;
    packetLoss: number;
  }
> = {
  "core-01-dist-01": { capacityMbps: 10000, utilizationPercent: 62, pps: 74200, packetLoss: 0.1 },
  "core-01-dist-02": { capacityMbps: 10000, utilizationPercent: 73, pps: 84230, packetLoss: 0.4 },
  "core-01-dist-03": { capacityMbps: 10000, utilizationPercent: 58, pps: 69100, packetLoss: 0.1 },

  "dist-01-edge-01": { capacityMbps: 1000, utilizationPercent: 45, pps: 12050, packetLoss: 0.0 },
  "dist-01-edge-02": { capacityMbps: 1000, utilizationPercent: 38, pps: 10420, packetLoss: 0.0 },
  "dist-01-edge-03": { capacityMbps: 1000, utilizationPercent: 52, pps: 14180, packetLoss: 0.2 },

  "dist-02-edge-04": { capacityMbps: 1000, utilizationPercent: 61, pps: 16490, packetLoss: 0.2 },
  "dist-02-edge-05": { capacityMbps: 1000, utilizationPercent: 74, pps: 19800, packetLoss: 0.5 },
  "dist-02-edge-06": { capacityMbps: 1000, utilizationPercent: 48, pps: 13120, packetLoss: 0.1 },

  "dist-03-edge-07": { capacityMbps: 1000, utilizationPercent: 39, pps: 10980, packetLoss: 0.0 },
  "dist-03-edge-08": { capacityMbps: 1000, utilizationPercent: 42, pps: 11840, packetLoss: 0.1 },
  "dist-03-edge-09": { capacityMbps: 1000, utilizationPercent: 56, pps: 15390, packetLoss: 0.2 },
};

/**
 * Initial Curated Traffic Flows (Manageable, realistic dataset)
 */
export const SEED_FLOWS: Omit<TrafficFlow, "path" | "alternatePath" | "status">[] = [
  {
    id: "FLOW-001",
    name: "Core Sync & Video Feed",
    source: "edge-01",
    destination: "edge-06",
    sourceName: "EDGE-01",
    destinationName: "EDGE-06",
    throughputMbps: 742,
    packetsPerSec: 18420,
    protocol: "HTTPS",
    priority: "High",
  },
  {
    id: "FLOW-002",
    name: "Database Replication Subnet",
    source: "edge-03",
    destination: "edge-08",
    sourceName: "EDGE-03",
    destinationName: "EDGE-08",
    throughputMbps: 512,
    packetsPerSec: 13950,
    protocol: "TCP",
    priority: "Normal",
  },
  {
    id: "FLOW-003",
    name: "Enterprise VoIP Gateway",
    source: "edge-04",
    destination: "edge-06",
    sourceName: "EDGE-04",
    destinationName: "EDGE-06",
    throughputMbps: 861,
    packetsPerSec: 21540,
    protocol: "UDP",
    priority: "High",
  },
  {
    id: "FLOW-004",
    name: "Internal Services RPC",
    source: "edge-02",
    destination: "edge-05",
    sourceName: "EDGE-02",
    destinationName: "EDGE-05",
    throughputMbps: 620,
    packetsPerSec: 15700,
    protocol: "TCP",
    priority: "Normal",
  },
  {
    id: "FLOW-005",
    name: "Storage SAN Backup",
    source: "edge-05",
    destination: "edge-09",
    sourceName: "EDGE-05",
    destinationName: "EDGE-09",
    throughputMbps: 480,
    packetsPerSec: 11900,
    protocol: "TCP",
    priority: "Bulk",
  },
  {
    id: "FLOW-006",
    name: "API Gateway Public Ingress",
    source: "edge-07",
    destination: "edge-02",
    sourceName: "EDGE-07",
    destinationName: "EDGE-02",
    throughputMbps: 390,
    packetsPerSec: 9850,
    protocol: "HTTPS",
    priority: "Normal",
  },
  {
    id: "FLOW-007",
    name: "Finance Department ERP",
    source: "edge-01",
    destination: "edge-03",
    sourceName: "EDGE-01",
    destinationName: "EDGE-03",
    throughputMbps: 410,
    packetsPerSec: 10450,
    protocol: "TCP",
    priority: "High",
  },
  {
    id: "FLOW-008",
    name: "Telemetry & Sensor Stream",
    source: "edge-08",
    destination: "edge-04",
    sourceName: "EDGE-08",
    destinationName: "EDGE-04",
    throughputMbps: 540,
    packetsPerSec: 14200,
    protocol: "UDP",
    priority: "Normal",
  },
  {
    id: "FLOW-009",
    name: "Operations NOC Monitoring",
    source: "edge-06",
    destination: "core-01",
    sourceName: "EDGE-06",
    destinationName: "CORE-01",
    throughputMbps: 680,
    packetsPerSec: 17200,
    protocol: "HTTPS",
    priority: "High",
  },
  {
    id: "FLOW-010",
    name: "Auth & Identity Directory",
    source: "edge-03",
    destination: "edge-07",
    sourceName: "EDGE-03",
    destinationName: "EDGE-07",
    throughputMbps: 450,
    packetsPerSec: 11200,
    protocol: "TCP",
    priority: "High",
  },
  {
    id: "FLOW-011",
    name: "Log Aggregator Collector",
    source: "edge-09",
    destination: "edge-05",
    sourceName: "EDGE-09",
    destinationName: "EDGE-05",
    throughputMbps: 520,
    packetsPerSec: 13100,
    protocol: "TCP",
    priority: "Bulk",
  },
  {
    id: "FLOW-012",
    name: "Secure Tunnel Gateway",
    source: "edge-02",
    destination: "edge-08",
    sourceName: "EDGE-02",
    destinationName: "EDGE-08",
    throughputMbps: 380,
    packetsPerSec: 9600,
    protocol: "HTTPS",
    priority: "Normal",
  },
];

/**
 * Historical trend seed data
 */
export const SEED_TRAFFIC_HISTORY: TrafficHistoryPoint[] = [
  { time: "10:00", demandGbps: 1.38, deliveredGbps: 1.35, utilizationPercent: 64 },
  { time: "10:05", demandGbps: 1.40, deliveredGbps: 1.37, utilizationPercent: 66 },
  { time: "10:10", demandGbps: 1.41, deliveredGbps: 1.36, utilizationPercent: 67 },
  { time: "10:15", demandGbps: 1.43, deliveredGbps: 1.38, utilizationPercent: 69 },
  { time: "10:20", demandGbps: 1.42, deliveredGbps: 1.36, utilizationPercent: 68 },
  { time: "10:25", demandGbps: 1.42, deliveredGbps: 1.36, utilizationPercent: 68 },
];

/**
 * Check if a path includes a given link
 */
export function pathIncludesLink(path: string[], linkSource: string, linkTarget: string): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i].toLowerCase();
    const v = path[i + 1].toLowerCase();
    const s = linkSource.toLowerCase();
    const t = linkTarget.toLowerCase();

    if ((u === s && v === t) || (u === t && v === s)) {
      return true;
    }
  }
  return false;
}

/**
 * Compute KPIs from current links and flows
 */
export function computeTrafficKpis(
  links: TrafficLinkData[],
  flows: TrafficFlow[]
): TrafficKpis {
  const activeFlows = flows.filter((f) => f.status !== "degraded");
  const reroutedCount = flows.filter((f) => f.isRerouted).length;

  const totalDemandMbps = flows.reduce((sum, f) => sum + f.throughputMbps, 0);
  const trafficDemandGbps = Number((totalDemandMbps / 1000).toFixed(2));

  // Delivered traffic accounts for loss on degraded/congested links
  let deliveredMbps = 0;
  flows.forEach((flow) => {
    if (flow.status === "degraded") {
      deliveredMbps += 0;
    } else if (flow.status === "congested") {
      deliveredMbps += flow.throughputMbps * 0.88;
    } else {
      deliveredMbps += flow.throughputMbps * 0.992;
    }
  });
  const deliveredGbps = Number((deliveredMbps / 1000).toFixed(2));

  // Weighted average network utilization across all active links
  const activeLinks = links.filter((l) => l.status !== "down");
  const avgUtilization =
    activeLinks.length > 0
      ? Math.round(
          activeLinks.reduce((sum, l) => sum + l.utilizationPercent, 0) /
            activeLinks.length
        )
      : 0;

  // Average packet loss across links
  const avgLoss =
    links.length > 0
      ? Number(
          (
            links.reduce((sum, l) => sum + l.packetLossPercent, 0) / links.length
          ).toFixed(1)
        )
      : 0.0;

  return {
    trafficDemandGbps,
    deliveredGbps,
    networkUtilizationPercent: avgUtilization,
    packetLossPercent: avgLoss,
    activeFlows: activeFlows.length,
    reroutedFlows: reroutedCount,
  };
}

/**
 * Initialize complete Traffic State from Topology
 */
export function initializeTrafficState(
  _nodes: NetworkNode[],
  edges: NetworkEdge[]
): TrafficSimulationState {
  // 1. Build initial links
  const links: TrafficLinkData[] = edges.map((edge) => {
    const key = `${edge.source.toLowerCase()}-${edge.target.toLowerCase()}`;
    const altKey = `${edge.target.toLowerCase()}-${edge.source.toLowerCase()}`;
    const base = BASE_LINK_METRICS[key] || BASE_LINK_METRICS[altKey] || {
      capacityMbps: 1000,
      utilizationPercent: 45,
      pps: 12000,
      packetLoss: 0.1,
    };

    const isDown = edge.status === "down";
    const util = isDown ? 0 : base.utilizationPercent;
    const throughput = isDown ? 0 : Math.round((base.capacityMbps * util) / 100);

    return {
      id: edge.id || `link-${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      sourceName: formatDeviceName(edge.source),
      targetName: formatDeviceName(edge.target),
      capacityMbps: base.capacityMbps,
      throughputMbps: throughput,
      utilizationPercent: util,
      packetsPerSec: isDown ? 0 : base.pps,
      packetLossPercent: isDown ? 100 : base.packetLoss,
      activeFlowsCount: 0,
      affectedFlowsCount: 0,
      status: getLinkStatusFromUtilization(util, isDown),
    };
  });

  // 2. Build initial flows with true topology paths
  const flows: TrafficFlow[] = SEED_FLOWS.map((seed) => {
    const path = findTopologyPath(seed.source, seed.destination, edges) || [
      seed.source,
      seed.destination,
    ];

    // Determine initial flow status from link states along path
    let status: FlowStatus = "normal";
    if (seed.throughputMbps > 800) {
      status = "high";
    }

    return {
      ...seed,
      path,
      status,
      isRerouted: false,
    };
  });

  // 3. Count active flows per link
  links.forEach((link) => {
    const activeOnLink = flows.filter((f) =>
      pathIncludesLink(f.path, link.source, link.target)
    );
    link.activeFlowsCount = activeOnLink.length;
  });

  const kpis = computeTrafficKpis(links, flows);

  return {
    links,
    flows,
    kpis,
    history: [...SEED_TRAFFIC_HISTORY],
    selectedFlowId: null,
    selectedLinkId: null,
    activeCongestionLinkId: null,
    lastReroutedFlowId: null,
    simulationStatus: "online",
  };
}

/**
 * Simulate Congestion on a given link
 */
export function simulateLinkCongestion(
  state: TrafficSimulationState,
  targetLinkId: string
): TrafficSimulationState {
  const targetLink = state.links.find(
    (l) => l.id.toLowerCase() === targetLinkId.toLowerCase()
  );
  if (!targetLink) return state;

  // 1. Mark target link as CONGESTED (> 90%)
  const updatedLinks = state.links.map((link) => {
    if (link.id.toLowerCase() === targetLinkId.toLowerCase()) {
      return {
        ...link,
        utilizationPercent: 94,
        throughputMbps: Math.round(link.capacityMbps * 0.94),
        packetLossPercent: 1.4,
        status: "congested" as LinkTrafficStatus,
        isSimulatedCongestion: true,
      };
    }
    return link;
  });

  // 2. Identify affected flows passing through this link
  let affectedCount = 0;
  const updatedFlows = state.flows.map((flow) => {
    const usesLink = pathIncludesLink(flow.path, targetLink.source, targetLink.target);

    if (usesLink && !flow.isRerouted) {
      affectedCount++;

      // In SDN traffic engineering, compute alternate path if one exists
      // e.g., if direct link is congested, route via Core/adjacent distribution pod
      let altPath: string[] | undefined;

      // Construct a valid SDN reroute using topology nodes
      if (flow.source.startsWith("edge-") && flow.destination.startsWith("edge-")) {
        // If congested link is within distribution/edge, alternate path traffic engineers via Core
        altPath = [
          flow.source,
          flow.path[1] || "dist-02",
          "core-01",
          flow.path[3] || "dist-03",
          flow.destination,
        ];
        // Clean duplicates
        altPath = altPath.filter((n, idx, arr) => idx === 0 || n !== arr[idx - 1]);
      } else {
        altPath = [flow.source, "core-01", flow.destination];
      }

      return {
        ...flow,
        status: "congested" as FlowStatus,
        affectedByLink: targetLink.id,
        alternatePath: altPath,
      };
    }
    return flow;
  });

  // Update affected count on target link
  const finalLinks = updatedLinks.map((l) => {
    if (l.id.toLowerCase() === targetLinkId.toLowerCase()) {
      return { ...l, affectedFlowsCount: affectedCount };
    }
    return l;
  });

  const kpis = computeTrafficKpis(finalLinks, updatedFlows);

  // Add historical trend point reflecting congestion
  const latestHistory = [
    ...state.history.slice(1),
    {
      time: "10:30",
      demandGbps: kpis.trafficDemandGbps,
      deliveredGbps: kpis.deliveredGbps,
      utilizationPercent: kpis.networkUtilizationPercent,
    },
  ];

  return {
    ...state,
    links: finalLinks,
    flows: updatedFlows,
    kpis,
    history: latestHistory,
    activeCongestionLinkId: targetLink.id,
    simulationStatus: "congested",
  };
}

/**
 * Execute simulated traffic reroute for an affected flow
 */
export function simulateFlowReroute(
  state: TrafficSimulationState,
  flowId: string
): TrafficSimulationState {
  const targetFlow = state.flows.find((f) => f.id === flowId);
  if (!targetFlow || !targetFlow.alternatePath) return state;

  // 1. Update flow to use alternate path
  const updatedFlows = state.flows.map((flow) => {
    if (flow.id === flowId) {
      return {
        ...flow,
        path: flow.alternatePath!,
        status: "rerouted" as FlowStatus,
        isRerouted: true,
        affectedByLink: undefined,
      };
    }
    return flow;
  });

  // 2. Reduce load on the previously congested link
  const updatedLinks = state.links.map((link) => {
    if (
      state.activeCongestionLinkId &&
      link.id.toLowerCase() === state.activeCongestionLinkId.toLowerCase()
    ) {
      // Utilization drops as flow bandwidth is offloaded
      const newUtil = Math.max(52, link.utilizationPercent - 28);
      const remainingAffected = Math.max(0, link.affectedFlowsCount - 1);

      return {
        ...link,
        utilizationPercent: newUtil,
        throughputMbps: Math.round((link.capacityMbps * newUtil) / 100),
        packetLossPercent: 0.3,
        status: getLinkStatusFromUtilization(newUtil),
        affectedFlowsCount: remainingAffected,
        isSimulatedCongestion: remainingAffected > 0,
      };
    }
    return link;
  });

  const kpis = computeTrafficKpis(updatedLinks, updatedFlows);

  const latestHistory = [
    ...state.history.slice(1),
    {
      time: "10:35",
      demandGbps: kpis.trafficDemandGbps,
      deliveredGbps: kpis.deliveredGbps,
      utilizationPercent: kpis.networkUtilizationPercent,
    },
  ];

  return {
    ...state,
    links: updatedLinks,
    flows: updatedFlows,
    kpis,
    history: latestHistory,
    lastReroutedFlowId: flowId,
    simulationStatus: "rerouting",
  };
}

/**
 * Reroute all affected flows and recover network
 */
export function rerouteAllAffectedFlows(
  state: TrafficSimulationState
): TrafficSimulationState {
  let currentState = state;
  const affectedFlows = state.flows.filter((f) => f.status === "congested");

  affectedFlows.forEach((flow) => {
    currentState = simulateFlowReroute(currentState, flow.id);
  });

  return {
    ...currentState,
    simulationStatus: "recovered",
    activeCongestionLinkId: null,
  };
}

/**
 * Reset all simulated congestion and restore baseline traffic
 */
export function resetTrafficSimulation(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): TrafficSimulationState {
  return initializeTrafficState(nodes, edges);
}

/**
 * Sync with authoritative NetPilot X backend network state
 * (If a device or link is DOWN in backend, reflect it in traffic state)
 */
export function syncWithBackendNetworkState(
  currentState: TrafficSimulationState,
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): TrafficSimulationState {
  const downNodeIds = new Set(
    nodes.filter((n) => n.status === "down").map((n) => n.id.toLowerCase())
  );
  const downEdgeIds = new Set(
    edges.filter((e) => e.status === "down").map((e) => e.id.toLowerCase())
  );

  // 1. Sync link states
  const syncedLinks = currentState.links.map((link) => {
    const isNodeDown =
      downNodeIds.has(link.source.toLowerCase()) ||
      downNodeIds.has(link.target.toLowerCase());
    const isEdgeDown =
      downEdgeIds.has(link.id.toLowerCase()) ||
      downEdgeIds.has(`link-${link.source}-${link.target}`.toLowerCase());

    if (isNodeDown || isEdgeDown) {
      return {
        ...link,
        status: "down" as LinkTrafficStatus,
        throughputMbps: 0,
        utilizationPercent: 0,
        packetLossPercent: 100,
        packetsPerSec: 0,
      };
    }

    return link;
  });

  // 2. Sync flow states: any flow traversing a down node/link is degraded
  const syncedFlows = currentState.flows.map((flow) => {
    const traversesDownNode = flow.path.some((nodeId) =>
      downNodeIds.has(nodeId.toLowerCase())
    );

    let traversesDownLink = false;
    for (let i = 0; i < flow.path.length - 1; i++) {
      const u = flow.path[i].toLowerCase();
      const v = flow.path[i + 1].toLowerCase();
      const linkMatch = syncedLinks.find(
        (l) =>
          (l.source.toLowerCase() === u && l.target.toLowerCase() === v) ||
          (l.source.toLowerCase() === v && l.target.toLowerCase() === u)
      );
      if (linkMatch && linkMatch.status === "down") {
        traversesDownLink = true;
        break;
      }
    }

    if (traversesDownNode || traversesDownLink) {
      return {
        ...flow,
        status: "degraded" as FlowStatus,
      };
    }

    return flow;
  });

  const kpis = computeTrafficKpis(syncedLinks, syncedFlows);

  return {
    ...currentState,
    links: syncedLinks,
    flows: syncedFlows,
    kpis,
  };
}
