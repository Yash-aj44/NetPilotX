type WebSocketHandler = (event: any) => void;

class NetworkWebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Set<WebSocketHandler> = new Set();
  private reconnectTimer: number | null = null;

  private getUrl(): string {
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000";
    const wsUrl = apiBase.replace(/^http/, "ws");
    return `${wsUrl}/ws/network`;
  }

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      this.ws = new WebSocket(this.getUrl());

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlers.forEach((handler) => handler(data));
        } catch (e) {
          console.error("Failed to parse WS message:", e);
        }
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.warn("WebSocket stream error (REST fallback active):", error);
      };
    } catch (err) {
      console.warn("WebSocket connection error (REST fallback active):", err);
      this.scheduleReconnect();
    }
  }

  subscribe(handler: WebSocketHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsManager = new NetworkWebSocketManager();
