import { useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";

/**
 * Suscribe a un evento de un canal WebSocket (Laravel Echo / Reverb).
 *
 * @param channel  Nombre del canal  (ej. "public-updates", "private-orders.1")
 * @param event    Nombre del evento (ej. "public.notification", "OrderUpdated")
 * @param callback Función que recibe los datos del evento
 *
 * @example
 * useWebSocketEvent('public-updates', 'public.notification', (data) => {
 *   console.log(data);
 * });
 */
export const useWebSocketEvent = <T = any>(
  channel: string,
  event: string,
  callback: (data: T) => void,
) => {
  const { subscribe, leave } = useWebSocket();

  // Ref para evitar que cambios de referencia en callback provoquen
  // re-suscripciones innecesarias (patrón "stable callback ref")
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const stableCallback = (data: T) => callbackRef.current(data);
    subscribe(channel, event, stableCallback);

    return () => {
      leave(channel);
    };
  }, [channel, event, subscribe, leave]);
};

/**
 * Retorna una función estable para enviar mensajes por WebSocket.
 * Loguea una advertencia si se intenta enviar sin conexión activa.
 */
export const useWebSocketSend = () => {
  const { send, isConnected } = useWebSocket();

  return useCallback(
    (type: string, data: any) => {
      if (!isConnected) {
        console.warn("Cannot send message: WebSocket not connected");
        return;
      }
      send(type, data);
    },
    [send, isConnected],
  );
};
