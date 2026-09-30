import type {
  DeviceStatus,
  DeviceType,
  LinkStatus,
  NetworkDevice,
  NetworkEdge,
  NetworkNode,
  NetworkState,
  NetworkTopology,
} from "../types/network";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000";

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { timeoutMs?: number; retries?: number }
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 12000;
  const maxRetries = options?.retries ?? 2;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers ?? {}),
        },
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(
          `API ${response.status}: ${errorText || response.statusText}`
        );

        // Do not retry 4xx errors
        if (response.status >= 400 && response.status < 500) {
          throw err;
        }
        lastError = err;
      } else {
        return (await response.json()) as T;
      }
    } catch (err: any) {
      clearTimeout(timer);

      if (err.name === "AbortError") {
        lastError = new Error(`Request timeout (${timeoutMs}ms) for ${endpoint}`);
      } else {
        lastError = err;
      }

      // Do not retry 4xx errors
      if (err.message && err.message.startsWith("API 4")) {
        throw err;
      }
    }

    attempt++;
    if (attempt <= maxRetries) {
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
  }

  throw lastError || new Error(`Failed request to ${endpoint}`);
}

export async function getNetworkTopology(): Promise<NetworkTopology> {
  const rawData = await apiRequest<{
    nodes: Array<{ id: string; name?: string; type: string; status: string }>;
    edges: Array<{ id?: string; source: string; target: string; status: string }>;
  }>("/api/network/topology");

  // Map edges & build lookup for target -> source (parentId)
  const parentMap = new Map<string, string>();

  const edges: NetworkEdge[] = (rawData.edges || []).map((e) => {
    parentMap.set(e.target, e.source);
    return {
      id: e.id || `link-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      status: (e.status as LinkStatus) || "up",
    };
  });

  // Map nodes with calculated parentId, connectedSystems, and formatted names
  const nodes: NetworkNode[] = (rawData.nodes || []).map((n) => {
    const parentId = parentMap.get(n.id);

    let connectedSystems = 22;
    if (n.type === "core") connectedSystems = 200;
    else if (n.type === "distribution") connectedSystems = 66;

    return {
      id: n.id,
      name: n.name || n.id.toUpperCase(),
      type: (n.type as DeviceType) || "edge",
      status: (n.status as DeviceStatus) || "up",
      parentId,
      connectedSystems,
    };
  });

  return { nodes, edges };
}

export interface BackendNetworkState {
  status: string;
  message: string;
  down_devices: string[] | Record<string, unknown>;
  down_endpoints: string[] | Record<string, unknown>;
  down_links: string[] | Record<string, unknown>;
  total_endpoints: number;
  endpoints_up: number;
  endpoints_down: number;
}

export async function getNetworkState(): Promise<NetworkState> {
  const backendState = await apiRequest<BackendNetworkState>("/api/network/state");
  const topology = await getNetworkTopology();

  const downDeviceIds = Array.isArray(backendState.down_devices)
    ? backendState.down_devices
    : Object.keys(backendState.down_devices ?? {});

  const devices: NetworkDevice[] = topology.nodes.map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
    status: downDeviceIds.includes(node.id) ? "down" : node.status,
    cpu: downDeviceIds.includes(node.id) ? 0 : 42,
    memory: downDeviceIds.includes(node.id) ? 0 : 58,
    latency: downDeviceIds.includes(node.id) ? 0 : 12,
    packetLoss: downDeviceIds.includes(node.id) ? 100 : 0,
  }));

  const totalSystems = backendState.total_endpoints ?? 200;
  const activeSystems = backendState.endpoints_up ?? 200;
  const offlineSystems = backendState.endpoints_down ?? 0;
  const networkHealth =
    totalSystems > 0
      ? Math.round((activeSystems / totalSystems) * 100)
      : 100;

  return {
    totalSystems,
    activeSystems,
    offlineSystems,
    networkHealth,
    devices,
    topology,
  };
}

export async function simulateDeviceFailure(deviceId: string) {
  return apiRequest<{
    success: boolean;
    device: string;
    status: string;
    message: string;
    affected_endpoints: string[];
  }>(`/api/network/simulate-failure?device_id=${encodeURIComponent(deviceId)}`, {
    method: "POST",
  });
}

export async function restoreDevice(deviceId: string) {
  return apiRequest<{
    success: boolean;
    device: string;
    status: string;
    message: string;
    restored_endpoints: string[];
  }>(`/api/network/restore?device_id=${encodeURIComponent(deviceId)}`, {
    method: "POST",
  });
}

export async function simulateLinkFailure(linkId: string) {
  return apiRequest<{
    success: boolean;
    link: string;
    status: string;
    message: string;
    affected_endpoints: string[];
  }>(`/api/network/simulate-link-failure?link_id=${encodeURIComponent(linkId)}`, {
    method: "POST",
  });
}

export async function restoreLink(linkId: string) {
  return apiRequest<{
    success: boolean;
    link: string;
    status: string;
    message: string;
    restored_endpoints: string[];
  }>(`/api/network/restore-link?link_id=${encodeURIComponent(linkId)}`, {
    method: "POST",
  });
}

export async function simulateEndpointFailure(endpointId: string) {
  return apiRequest<{
    success: boolean;
    endpoint: string;
    status: string;
    message: string;
  }>(`/api/network/simulate-endpoint-failure?endpoint_id=${encodeURIComponent(endpointId)}`, {
    method: "POST",
  });
}

export async function restoreEndpoint(endpointId: string) {
  return apiRequest<{
    success: boolean;
    endpoint: string;
    status: string;
    message: string;
  }>(`/api/network/restore-endpoint?endpoint_id=${encodeURIComponent(endpointId)}`, {
    method: "POST",
  });
}

export interface BackendAlert {
  id: string;
  severity: string;
  title: string;
  device: string;
  message: string;
  timestamp: string;
}

export async function getAlerts() {
  return apiRequest<BackendAlert[]>("/api/alerts");
}

export interface BackendIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  affected_systems: string[];
  affected_count: number;
  root_cause: string;
  created_at: string;
}

export async function getIncidents() {
  return apiRequest<BackendIncident[]>("/api/incidents");
}

export interface MonitoringDeviceData {
  device: string;
  cpu: number;
  memory: number;
  latency: number;
  packetLoss: number;
  status: "up" | "down";
}

export async function getMonitoring(): Promise<MonitoringDeviceData[]> {
  const rawData = await apiRequest<
    Array<{
      device: string;
      cpu?: number;
      memory?: number;
      latency?: number;
      packet_loss?: number;
      status?: string;
    }>
  >("/api/monitoring");

  return (rawData || []).map((item) => ({
    device: item.device,
    cpu: item.cpu ?? (item.status === "down" ? 0 : 42),
    memory: item.memory ?? (item.status === "down" ? 0 : 58),
    latency: item.latency ?? (item.status === "down" ? 0 : 12),
    packetLoss: item.packet_loss ?? (item.status === "down" ? 100 : 0),
    status: item.status === "down" ? "down" : "up",
  }));
}

export interface TrafficDeviceData {
  device: string;
  bandwidth_mbps: number;
  throughput_mbps: number;
  utilization_percent: number;
  packets_per_second: number;
  ingress_mbps: number;
  egress_mbps: number;
  status: "up" | "down";
}

export async function getTraffic(): Promise<TrafficDeviceData[]> {
  return apiRequest<TrafficDeviceData[]>("/api/traffic");
}

export async function askAI(message: string) {
  return apiRequest<{
    response: string;
  }>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
    }),
  });
}