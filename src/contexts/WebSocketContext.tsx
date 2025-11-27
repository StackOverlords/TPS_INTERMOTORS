import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { websocketService, WebSocketService } from '../services/websocket.service';
import { useTaskNotificationsContext } from './TaskNotificationsContext';

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
          // console.log('🔌 Iniciando conexión a Reverb...');
          await websocketService.connect();
          setIsConnected(true);
          // console.log('WebSocket conectado y listo para suscripciones');

          // Suscripción a notificaciones públicas con integración de tareas
          websocketService.listen('public-updates', 'public.notification', (data: any) => {
            // console.log('Notificación pública recibida:', data);

            // Detectar si es una notificación de tarea
            const message = data.message || data.msg || '';
            const taskType = 'update-prices'; // Tipo de tarea

            // Si el mensaje indica inicio de tarea
            if (message.toLowerCase().includes('en proceso') || message.toLowerCase().includes('procesando')) {
              // Tercer parámetro: true = mostrar flotante, false = solo en panel del bell
              const taskId = addAndStartTask('Actualización de precios', message, false);
              activeTasksRef.current.set(taskType, taskId);
              // console.log(`Tarea iniciada: ${taskId}`);
            }
            // Si el mensaje indica finalización exitosa
            else if (message.toLowerCase().includes('realizada') || message.toLowerCase().includes('completad')) {
              const taskId = activeTasksRef.current.get(taskType);
              if (taskId) {
                /// pendiente a cambiar cuanto vamos a necesitaaaarrrr
                console.log(message,"aaaa")
                completeTask(taskId, message, 10000); // Se mostrará por 10 segundos
                activeTasksRef.current.delete(taskType);
                // console.log(`Tarea completada: ${taskId}`);
              } else {
                console.warn('No se encontró tarea activa para completar');
              }
            }
            // Si el mensaje indica error
            else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('fall')) {
              const taskId = activeTasksRef.current.get(taskType);
              if (taskId) {
                failTask(taskId, message, 8000); // Errores se mostrarán por 8 segundos
                activeTasksRef.current.delete(taskType);
                // console.log(`Tarea falló: ${taskId}`);
              } else {
                console.warn('No se encontró tarea activa para marcar como error');
              }
            }
          });

          // Canal para inventario
          // websocketService.listen('inventory', 'InventorySync', (data: any) => {
          // //   console.log('📊 Sincronización de inventario:', data);
          //   const taskId = addAndStartTask('Inventario', data.message);
          //   // ... lógica similar
          // });

        } catch (error) {
          console.error('Falló la conexión al WebSocket:', error);
          setIsConnected(false);

          // Intentar reconectar después de 5 segundos
          reconnectTimeout = setTimeout(() => {
            initSocket();
          }, 5000);
        }
      };

      initSocket();

      // Polling para verificar estado de conexión
      checkConnection = setInterval(() => {
        const currentState = websocketService.isConnected;
        setIsConnected(currentState);
      }, 3000);
    }

    return () => {
      if (checkConnection) clearInterval(checkConnection);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      // // console.log('🔌 Desconectando WebSocket...');
      websocketService.disconnect();
    };
  }, [autoConnect, addAndStartTask, completeTask, failTask]);

  // 3. Adaptador para 'send' (Loguea advertencia, Echo es para escuchar)
  const send = (type: string, data: any) => {
    console.warn('WebSocket via Echo is read-only. Use your HTTP API to broadcast events.', type, data);
  };

  // 4. Nueva función subscribe genérica
  const subscribe = (channel: string, event: string, callback: (data: any) => void) => {
    websocketService.listen(channel, event, callback);
  };

  const leave = (channel: string) => {
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