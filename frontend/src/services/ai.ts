import type { NetworkDevice, NetworkNode, NetworkState } from "../types/network";
import type { IncidentRecord } from "../context/NetworkContext";

export interface CopilotQueryPayload {
  message: string;
  networkState: NetworkState | null;
  selectedNode: NetworkNode | null;
  selectedDevice: NetworkDevice | null;
  failureAlert: { deviceId: string; deviceName: string; affectedSystems: number } | null;
  incidents: IncidentRecord[];
}

export interface CopilotResponse {
  answer: string;
  suggestedActions?: { label: string; actionType: "recover" | "inspect" | "refresh"; targetId?: string }[];
}

export async function askCopilot(payload: CopilotQueryPayload): Promise<CopilotResponse> {
  // Simulate network query latency
  await new Promise((resolve) => setTimeout(resolve, 550));

  const msg = payload.message.toLowerCase();
  const { failureAlert, selectedNode, networkState } = payload;

  const health = networkState?.networkHealth ?? 100;
  const offlineCount = networkState?.offlineSystems ?? 0;

  // 1. Device failure query or specific device status
  if (msg.includes("offline") || msg.includes("failed") || msg.includes("why") || msg.includes("edge-")) {
    if (failureAlert) {
      return {
        answer: `**${failureAlert.deviceName}** is currently **OFFLINE** due to a simulated link failure from its parent distribution switch (**DIST-02**).\n\n• **Affected Endpoints:** ${failureAlert.affectedSystems} systems\n• **Impact:** Network health dropped to **${health}%** (${offlineCount} total endpoints offline).\n• **Root Cause:** Interrupted interface connection between DIST-02 and ${failureAlert.deviceName}.`,
        suggestedActions: [
          { label: `Initiate Recovery for ${failureAlert.deviceName}`, actionType: "recover" },
          { label: "Inspect Dependency Path", actionType: "inspect", targetId: failureAlert.deviceId },
        ],
      };
    } else {
      return {
        answer: `All monitored network devices are operating **NORMAL** with **100% Network Health**. No active device failures or link outages are currently detected across the 200 endpoint systems.`,
        suggestedActions: [{ label: "Refresh Network State", actionType: "refresh" }],
      };
    }
  }

  // 2. How to recover query
  if (msg.includes("recover") || msg.includes("fix") || msg.includes("restore")) {
    if (failureAlert) {
      return {
        answer: `To recover **${failureAlert.deviceName}** and restore connectivity to the ${failureAlert.affectedSystems} affected endpoints:\n\n1. Click **"Initiate Network Recovery"** in the active incident drawer.\n2. NetPilot X will execute a reverse recovery cascade.\n3. Packet flow will automatically resume along restored links.`,
        suggestedActions: [{ label: "Execute Network Recovery", actionType: "recover" }],
      };
    } else {
      return {
        answer: `No active network failures need recovery. If you wish to test failure response, use the **Simulation Controls** on the Network page to inject a controlled device failure.`,
      };
    }
  }

  // 3. Status summary query
  if (msg.includes("status") || msg.includes("health") || msg.includes("overview")) {
    return {
      answer: `**NetPilot X NOC Status Summary:**\n\n• **Overall Health:** ${health}%\n• **Monitored Endpoints:** ${networkState?.activeSystems ?? 200} / 200 Online\n• **Offline Systems:** ${offlineCount}\n• **Active Failure Alerts:** ${failureAlert ? `1 (${failureAlert.deviceName})` : "0 (None)"}`,
      suggestedActions: failureAlert
        ? [{ label: `Recover ${failureAlert.deviceName}`, actionType: "recover" }]
        : [],
    };
  }

  // 4. Default contextual answer
  if (selectedNode) {
    return {
      answer: `Regarding **${selectedNode.name}** (${selectedNode.type.toUpperCase()} Switch):\n\n• **Status:** ${selectedNode.status.toUpperCase()}\n• **Parent Node:** ${selectedNode.parentId || "CORE-01"}\n• **Connected Endpoints:** ${selectedNode.connectedSystems ?? 0} systems\n\nAsk me specific questions about uplink performance or failure recovery!`,
    };
  }

  return {
    answer: `NetPilot X AI Assistant is online. I am continuously monitoring 1 Core, 3 Distribution, 9 Edge switches, and 200 endpoint systems.\n\nAsk me: *"Why is EDGE-05 offline?"*, *"Show network status"*, or *"How to recover failure?"*.`,
    suggestedActions: failureAlert
      ? [{ label: `Diagnose ${failureAlert.deviceName}`, actionType: "inspect", targetId: failureAlert.deviceId }]
      : [{ label: "Check Network Health", actionType: "refresh" }],
  };
}