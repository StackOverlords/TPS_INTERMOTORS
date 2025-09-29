import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { websocketService, WebSocketService } from '../services/websocket.service';

interface WebSocketContextType {
  isConnected: boolean;
  send: (type: string, data: any) => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  service: WebSocketService;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export const WebSocketProvider = ({ children, autoConnect = true }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (autoConnect) {
      const connect = async () => {
        try {
          await websocketService.connect();
          setIsConnected(true);
        } catch (error) {
          console.error('Failed to connect to WebSocket:', error);
          setIsConnected(false);
        }
      };

      connect();

      const checkConnection = setInterval(() => {
        setIsConnected(websocketService.isConnected);
      }, 1000);

      return () => {
        clearInterval(checkConnection);
        websocketService.disconnect();
      };
    }
  }, [autoConnect]);

  const send = (type: string, data: any) => {
    websocketService.send(type, data);
  };

  const subscribe = (event: string, callback: (data: any) => void) => {
    websocketService.on(event, callback);

    return () => {
      websocketService.off(event, callback);
    };
  };

  const value: WebSocketContextType = {
    isConnected,
    send,
    subscribe,
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
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};