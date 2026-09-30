import { askAI } from "./api";

export interface CopilotQueryPayload {
  message: string;
  failureAlert?: { deviceId: string; deviceName: string; affectedSystems: number } | null;
}

export interface CopilotResponse {
  answer: string;
  suggestedActions?: { label: string; actionType: "recover" | "inspect" | "refresh"; targetId?: string }[];
}

export async function askCopilot(
  message: string,
  failureAlert?: { deviceId: string; deviceName: string } | null
): Promise<CopilotResponse> {
  try {
    const res = await askAI(message);

    let suggestedActions: CopilotResponse["suggestedActions"] = undefined;
    if (failureAlert) {
      suggestedActions = [
        { label: `Initiate Recovery for ${failureAlert.deviceName}`, actionType: "recover" },
        { label: "Inspect Dependency Path", actionType: "inspect", targetId: failureAlert.deviceId },
      ];
    } else {
      suggestedActions = [
        { label: "Refresh Network State", actionType: "refresh" },
      ];
    }

    return {
      answer: res.response,
      suggestedActions,
    };
  } catch (error) {
    console.error("AI service call error:", error);
    return {
      answer: "NetPilot AI is temporarily unavailable. Check the backend connection and try again.",
    };
  }
}