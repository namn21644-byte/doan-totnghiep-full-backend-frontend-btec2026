import { useCallback, useEffect, useRef, useState } from "react";
import { App as AntApp } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";

const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8080/ws";

export interface WsEvent {
  event: string;
  data: Record<string, unknown>;
}

type WsHandler = (event: WsEvent) => void;

const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 30000;
const PING_INTERVAL_MS = 25000;

export function useWebSocket(options?: {
  onScanEvent?: WsHandler;
  onAlertEvent?: WsHandler;
  onAttackEvent?: WsHandler;
  enabled?: boolean;
}) {
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const incrementAlerts = useNotificationStore((s) => s.incrementAlerts);
  const enabled = options?.enabled ?? true;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const pingTimer = useRef<ReturnType<typeof setInterval>>();
  const mountedRef = useRef(true);

  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);

  const onScanEventRef = useRef(options?.onScanEvent);
  const onAlertEventRef = useRef(options?.onAlertEvent);
  const onAttackEventRef = useRef(options?.onAttackEvent);
  onScanEventRef.current = options?.onScanEvent;
  onAlertEventRef.current = options?.onAlertEvent;
  onAttackEventRef.current = options?.onAttackEvent;

  const handleMessage = useCallback(
    (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as WsEvent;
        if (!parsed.event) return;

        setLastEvent(parsed);

        if (parsed.event.startsWith("scan:")) {
          onScanEventRef.current?.(parsed);
          queryClient.invalidateQueries({ queryKey: ["scans"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }

        if (parsed.event.startsWith("alert:")) {
          onAlertEventRef.current?.(parsed);
          incrementAlerts();
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["logs"] });

          if (
            parsed.event === "alert:new" ||
            parsed.event === "alert:created"
          ) {
            const isSim = parsed.data.is_simulation === true;
            const title =
              (parsed.data.title as string) ?? "Cảnh báo mới";
            const severity = (parsed.data.severity as string) ?? "";
            const prefix = isSim ? "[MÔ PHỎNG] " : "";
            message.warning(`${prefix}[${severity.toUpperCase()}] ${title}`);
          }
        }

        if (parsed.event.startsWith("attack:")) {
          onAttackEventRef.current?.(parsed);
          queryClient.invalidateQueries({ queryKey: ["attack-runs"] });
        }

        if (parsed.event === "log:new") {
          queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
      } catch {
        // Ignore malformed messages.
      }
    },
    [incrementAlerts, message, queryClient],
  );

  const connect = useCallback(() => {
    if (!mountedRef.current || !isAuthenticated || !enabled) return;

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const ws = new WebSocket(WS_BASE_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      reconnectAttempt.current = 0;
      setConnected(true);

      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (ev) => {
      handleMessage(ev.data as string);
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      if (pingTimer.current) clearInterval(pingTimer.current);

      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** reconnectAttempt.current,
        RECONNECT_MAX_MS,
      );
      reconnectAttempt.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [enabled, handleMessage, isAuthenticated]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pingTimer.current) clearInterval(pingTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { connected, lastEvent };
}

export default useWebSocket;
