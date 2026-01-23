import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { websocketService, WebSocketService } from '../services/websocket.service';
import { useTaskNotificationsContext } from './TaskNotificationsContext';
import logger from '@/utils/logger';

const wsContextLogger = logger.withModule('WS_CONTEXT');

// 1. Actualizamos la interfaz para que coincida con la realidad
interface WebSocketContextType {
  isConnected: boolean;
  send: (type: string, data: any) => void; 
  // Actualizamos subscribe para requerir 'channel' y 'event'
  subscribe: (channel: string, event: string, callback: (data: any) => void) => void;
  leave: (channel: string) => void;
  service: WebSocketService;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export const WebSocketProvider = ({ children, autoConnect = true }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const { completeTask, failTask, addAndStartTask } = useTaskNotificationsContext();

  // Ref para rastrear IDs de tareas activas por tipo
  const activeTasksRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let checkConnection: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;

    if (autoConnect) {
      const initSocket = async () => {
        try {
          wsContextLogger.info('Iniciando conexión a Reverb...');
          await websocketService.connect();
          setIsConnected(true);
          wsContextLogger.info('WebSocket conectado y listo para suscripciones');

          // Suscripción a notificaciones públicas con integración de tareas
          websocketService.listen('public-updates', 'public.notification', (data: any) => {
            wsContextLogger.info('NOTIFICACION RECIBIDA [public-updates]', {
              channel: 'public-updates',
              event: 'public.notification',
              data,
              timestamp: new Date().toISOString()
            });

            // Detectar si es una notificación de tarea
            const message = data.message || data.msg || '';
            const taskType = 'update-prices'; // Tipo de tarea

            // Si el mensaje indica inicio de tarea
            if (message.toLowerCase().includes('en proceso') || message.toLowerCase().includes('procesando')) {
              // Tercer parámetro: true = mostrar flotante, false = solo en panel del bell
              const taskId = addAndStartTask('Actualización de precios', message, false);
              activeTasksRef.current.set(taskType, taskId);
              wsContextLogger.info('Tarea iniciada', { taskId, taskType, message });
            }
            // Si el mensaje indica finalización exitosa
            else if (message.toLowerCase().includes('realizada') || message.toLowerCase().includes('completad')) {
              const taskId = activeTasksRef.current.get(taskType);
              if (taskId) {
                wsContextLogger.info('Tarea completada', { taskId, message });
                completeTask(taskId, message, 10000); // Se mostrará por 10 segundos
                activeTasksRef.current.delete(taskType);
              } else {
                wsContextLogger.warn('No se encontró tarea activa para completar', { taskType, message });
              }
            }
            // Si el mensaje indica error
            else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('fall')) {
              const taskId = activeTasksRef.current.get(taskType);
              if (taskId) {
                wsContextLogger.error('Tarea falló', { taskId, message });
                failTask(taskId, message, 8000); // Errores se mostrarán por 8 segundos
                activeTasksRef.current.delete(taskType);
              } else {
                wsContextLogger.warn('No se encontró tarea activa para marcar como error', { taskType, message });
              }
            }
            // Mensaje no reconocido
            else {
              wsContextLogger.debug('Mensaje no clasificado recibido', { message });
            }
          });

        } catch (error) {
          wsContextLogger.error('Falló la conexión al WebSocket', { error });
          setIsConnected(false);

          // Intentar reconectar después de 5 segundos
          wsContextLogger.info('Reintentando conexión en 5 segundos...');
          reconnectTimeout = setTimeout(() => {
            initSocket();
          }, 5000);
        }
      };

      initSocket();

      // Polling para verificar estado de conexión
      checkConnection = setInterval(() => {
        const currentState = websocketService.isConnected;
        setIsConnected((prev) => {
          if (currentState !== prev) {
            wsContextLogger.debug('Estado de conexión actualizado', { isConnected: currentState });
          }
          return currentState;
        });
      }, 3000);
    }

    return () => {
      if (checkConnection) clearInterval(checkConnection);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      wsContextLogger.info('Limpiando WebSocket Provider...');
      websocketService.disconnect();
    };
  }, [autoConnect, addAndStartTask, completeTask, failTask]);

  // 3. Adaptador para 'send' (Loguea advertencia, Echo es para escuchar)
  const send = (type: string, data: any) => {
    wsContextLogger.warn('WebSocket via Echo is read-only. Use your HTTP API to broadcast events.', { type, data });
  };

  // 4. Nueva función subscribe genérica
  const subscribe = (channel: string, event: string, callback: (data: any) => void) => {
    wsContextLogger.debug('Subscribiendo a canal desde context', { channel, event });
    websocketService.listen(channel, event, callback);
  };

  const leave = (channel: string) => {
    wsContextLogger.debug('Dejando canal desde context', { channel });
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
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};