import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  websocketService,
  WebSocketService,
} from "../services/websocket.service";
import { useTaskNotificationsContext } from "./TaskNotificationsContext";
import logger from "@/utils/logger";

const wsContextLogger = logger.withModule("WS_CONTEXT");

interface WebSocketContextType {
  isConnected: boolean;
  send: (type: string, data: any) => void;
  subscribe: (
    channel: string,
    event: string,
    callback: (data: any) => void
  ) => void;
  leave: (channel: string) => void;
  service: WebSocketService;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export const WebSocketProvider = ({
  children,
  autoConnect = true,
}: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const { completeTask, failTask, addAndStartTask } =
    useTaskNotificationsContext();

  const activeTasksRef = useRef<Map<string, string>>(new Map());

  // Ref para evitar stale closures en el reconnect recursivo
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const checkConnectionRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  useEffect(() => {
    if (!autoConnect) return;

    let cancelled = false;

    const initSocket = async () => {
      try {
        wsContextLogger.info("Iniciando conexión a Reverb...");
        await websocketService.connect();

        if (cancelled) return;

        setIsConnected(true);
        wsContextLogger.info("WebSocket conectado y listo para suscripciones");

        websocketService.listen(
          "public-updates",
          "public.notification",
          (data: any) => {
            wsContextLogger.info("NOTIFICACION RECIBIDA [public-updates]", {
              channel: "public-updates",
              event: "public.notification",
              data,
              timestamp: new Date().toISOString(),
            });

            const message = data.message || data.msg || "";
            const taskType = "update-prices";

            if (
              message.toLowerCase().includes("en proceso") ||
              message.toLowerCase().includes("procesando")
            ) {
              const taskId = addAndStartTask(
                "Actualización de precios",
                message,
                false
              );
              activeTasksRef.current.set(taskType, taskId);
              wsContextLogger.info("Tarea iniciada", {
                taskId,
                taskType,
                message,
              });
            } else if (
              message.toLowerCase().includes("realizada") ||
              message.toLowerCase().includes("completad")
            ) {
              const taskId = activeTasksRef.current.get(taskType);
              if (taskId) {
                wsContextLogger.info("Tarea completada", { taskId, message });
                completeTask(taskId, message, 10000);
                activeTasksRef.current.delete(taskType);
              } else {
                wsContextLogger.warn(
                  "No se encontró tarea activa para completar",
                  {
                    taskType,
                    message,
                  }
                );
              }
            } else if (
              message.toLowerCase().includes("error") ||
              message.toLowerCase().includes("fall")
            ) {
              const taskId = activeTasksRef.current.get(taskType);
              if (taskId) {
                wsContextLogger.error("Tarea falló", { taskId, message });
                failTask(taskId, message, 8000);
                activeTasksRef.current.delete(taskType);
              } else {
                wsContextLogger.warn(
                  "No se encontró tarea activa para marcar como error",
                  { taskType, message }
                );
              }
            } else {
              wsContextLogger.debug("Mensaje no clasificado recibido", {
                message,
              });
            }
          }
        );
      } catch (error) {
        if (cancelled) return;

        wsContextLogger.error("Falló la conexión al WebSocket", { error });
        setIsConnected(false);

        wsContextLogger.info("Reintentando conexión en 5 segundos...");
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!cancelled) initSocket();
        }, 5000);
      }
    };

    initSocket();

    checkConnectionRef.current = setInterval(() => {
      if (cancelled) return;
      const currentState = websocketService.isConnected;
      setIsConnected((prev) => {
        if (currentState !== prev) {
          wsContextLogger.debug("Estado de conexión actualizado", {
            isConnected: currentState,
          });
        }
        return currentState;
      });
    }, 3000);

    return () => {
      cancelled = true;
      if (checkConnectionRef.current) clearInterval(checkConnectionRef.current);
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      wsContextLogger.info("Limpiando WebSocket Provider...");
      websocketService.disconnect();
    };
  }, [autoConnect, addAndStartTask, completeTask, failTask]);

  const send = (type: string, data: any) => {
    wsContextLogger.warn(
      "WebSocket via Echo is read-only. Use your HTTP API to broadcast events.",
      { type, data }
    );
  };

  const subscribe = (
    channel: string,
    event: string,
    callback: (data: any) => void
  ) => {
    wsContextLogger.debug("Subscribiendo a canal desde context", {
      channel,
      event,
    });
    websocketService.listen(channel, event, callback);
  };

  const leave = (channel: string) => {
    wsContextLogger.debug("Dejando canal desde context", { channel });
    websocketService.leave(channel);
  };

  const value: WebSocketContextType = {
    isConnected,
    send,
    subscribe,
    leave,
    service: websocketService,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
