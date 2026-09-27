import type {
  NetworkDevice,
  NetworkEdge,
  NetworkNode,
  NetworkState,
  NetworkTopology,
} from "../types/network";

const distributionSwitches: NetworkNode[] = [
  {
    id: "dist-01",
    name: "DIST-01",
    type: "distribution",
    status: "up",
    connectedSystems: 0,
  },
  {
    id: "dist-02",
    name: "DIST-02",
    type: "distribution",
    status: "up",
    connectedSystems: 0,
  },
  {
    id: "dist-03",
    name: "DIST-03",
    type: "distribution",
    status: "up",
    connectedSystems: 0,
  },
];

const edgeSwitches: NetworkNode[] = [
  {
    id: "edge-01",
    name: "EDGE-01",
    type: "edge",
    status: "up",
    parentId: "dist-01",
    connectedSystems: 22,
  },
  {
    id: "edge-02",
    name: "EDGE-02",
    type: "edge",
    status: "up",
    parentId: "dist-01",
    connectedSystems: 22,
  },
  {
    id: "edge-03",
    name: "EDGE-03",
    type: "edge",
    status: "up",
    parentId: "dist-01",
    connectedSystems: 23,
  },
  {
    id: "edge-04",
    name: "EDGE-04",
    type: "edge",
    status: "up",
    parentId: "dist-02",
    connectedSystems: 22,
  },
  {
    id: "edge-05",
    name: "EDGE-05",
    type: "edge",
    status: "up",
    parentId: "dist-02",
    connectedSystems: 22,
  },
  {
    id: "edge-06",
    name: "EDGE-06",
    type: "edge",
    status: "up",
    parentId: "dist-02",
    connectedSystems: 22,
  },
  {
    id: "edge-07",
    name: "EDGE-07",
    type: "edge",
    status: "up",
    parentId: "dist-03",
    connectedSystems: 22,
  },
  {
    id: "edge-08",
    name: "EDGE-08",
    type: "edge",
    status: "up",
    parentId: "dist-03",
    connectedSystems: 22,
  },
  {
    id: "edge-09",
    name: "EDGE-09",
    type: "edge",
    status: "up",
    parentId: "dist-03",
    connectedSystems: 23,
  },
];

const coreNode: NetworkNode = {
  id: "core-01",
  name: "CORE-01",
  type: "core",
  status: "up",
};

const topologyEdges: NetworkEdge[] = [
  {
    id: "core-dist-01",
    source: "core-01",
    target: "dist-01",
    status: "up",
  },
  {
    id: "core-dist-02",
    source: "core-01",
    target: "dist-02",
    status: "up",
  },
  {
    id: "core-dist-03",
    source: "core-01",
    target: "dist-03",
    status: "up",
  },

  {
    id: "dist-01-edge-01",
    source: "dist-01",
    target: "edge-01",
    status: "up",
  },
  {
    id: "dist-01-edge-02",
    source: "dist-01",
    target: "edge-02",
    status: "up",
  },
  {
    id: "dist-01-edge-03",
    source: "dist-01",
    target: "edge-03",
    status: "up",
  },

  {
    id: "dist-02-edge-04",
    source: "dist-02",
    target: "edge-04",
    status: "up",
  },
  {
    id: "dist-02-edge-05",
    source: "dist-02",
    target: "edge-05",
    status: "up",
  },
  {
    id: "dist-02-edge-06",
    source: "dist-02",
    target: "edge-06",
    status: "up",
  },

  {
    id: "dist-03-edge-07",
    source: "dist-03",
    target: "edge-07",
    status: "up",
  },
  {
    id: "dist-03-edge-08",
    source: "dist-03",
    target: "edge-08",
    status: "up",
  },
  {
    id: "dist-03-edge-09",
    source: "dist-03",
    target: "edge-09",
    status: "up",
  },
];

export const mockTopology: NetworkTopology = {
  nodes: [
    coreNode,
    ...distributionSwitches,
    ...edgeSwitches,
  ],
  edges: topologyEdges,
};

export const mockDevices: NetworkDevice[] = [
  {
    id: "core-01",
    name: "CORE-01",
    type: "core",
    status: "up",
    cpu: 31,
    memory: 46,
    latency: 4,
    packetLoss: 0,
  },

  ...distributionSwitches.map((device) => ({
    id: device.id,
    name: device.name,
    type: device.type,
    status: device.status,
    cpu: 35,
    memory: 49,
    latency: 7,
    packetLoss: 0,
  })),

  ...edgeSwitches.map((device) => ({
    id: device.id,
    name: device.name,
    type: device.type,
    status: device.status,
    cpu: 42,
    memory: 58,
    latency: 12,
    packetLoss: 0,
  })),
];

export const mockNetworkState: NetworkState = {
  totalSystems: 200,
  activeSystems: 200,
  offlineSystems: 0,
  networkHealth: 100,
  devices: mockDevices,
  topology: mockTopology,
};

export async function getNetworkTopology(): Promise<NetworkTopology> {
  return mockTopology;
}

export async function getNetworkState(): Promise<NetworkState> {
  return mockNetworkState;
}