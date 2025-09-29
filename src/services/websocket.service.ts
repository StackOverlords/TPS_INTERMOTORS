import { io, Socket } from 'socket.io-client';
import authSDK from './sdk-simple-auth';

type WebSocketEventListener = (data: any) => void;

export class WebSocketService {
  private socket: Socket | null = null;
  private url: string;
  private listeners: Map<string, WebSocketEventListener[]> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(this.url)
        this.socket = io(this.url, {
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          path: '/socket.io/',
          auth: {
            key: import.meta.env.VITE_SOCKET_KEY,
            Authorization: `Bearer ${authSDK.getAccessToken() || ''}`
          },
          transports: ['websocket'],
          forceNew: true,
          withCredentials: true
        });

        this.socket.on('connect', () => {
          console.log('Socket.IO connected');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket.IO disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          reject(error);
        });

        this.socket.onAny((event, data) => {
          this.handleMessage({ type: event, data });
        });

        this.socket.connect();
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  send(type: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(type, data);
    } else {
      console.warn('Socket.IO is not connected');
    }
  }

  on(event: string, listener: WebSocketEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: WebSocketEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private handleMessage(message: { type: string; data: any }): void {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(listener => listener(message.data));
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const websocketService = new WebSocketService(
  import.meta.env.VITE_WS_URL || 'http://192.168.1.14:8589'
);
