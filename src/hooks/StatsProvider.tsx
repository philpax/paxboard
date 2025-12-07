import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { StatsContext, type StatsState } from "./StatsContext.ts";
import type { StatsMessage } from "../../shared/types";

type StatsData = Omit<StatsState, "connected" | "subscribe" | "unsubscribe">;

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<StatsData & { connected: boolean }>({
    cpu: null,
    memory: null,
    disks: null,
    gpus: null,
    network: null,
    processes: null,
    aiServices: null,
    connected: false,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const subscribe = useCallback((channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "subscribe", channel }));
    }
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "unsubscribe", channel }));
    }
  }, []);

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/stats`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setStats((prev) => ({ ...prev, connected: true }));
      };

      ws.onmessage = (event) => {
        const message: StatsMessage = JSON.parse(event.data);
        setStats((prev) => ({ ...prev, [message.type]: message.data }));
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, reconnecting...");
        setStats((prev) => ({ ...prev, connected: false }));
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, []);

  const value = useMemo(
    () => ({ ...stats, subscribe, unsubscribe }),
    [stats, subscribe, unsubscribe],
  );

  return (
    <StatsContext.Provider value={value}>{children}</StatsContext.Provider>
  );
}
