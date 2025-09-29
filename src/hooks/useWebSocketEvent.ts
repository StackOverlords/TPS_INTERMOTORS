import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

export const useWebSocketEvent = <T = any>(
  event: string,
  callback: (data: T) => void,
  dependencies: any[] = []
) => {
  const { subscribe } = useWebSocket();

  const memoizedCallback = useCallback(callback, dependencies);

  useEffect(() => {
    const unsubscribe = subscribe(event, memoizedCallback);
    return unsubscribe;
  }, [event, memoizedCallback, subscribe]);
};

export const useWebSocketSend = () => {
  const { send, isConnected } = useWebSocket();

  return useCallback(
    (type: string, data: any) => {
      if (isConnected) {
        send(type, data);
      } else {
        console.warn('Cannot send message: WebSocket not connected');
      }
    },
    [send, isConnected]
  );
};