import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import authSDK from './sdk-simple-auth';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

type WebSocketEventListener = (data: any) => void;

export class WebSocketService {
  private echo: Echo<any> | null = null;
  private url: string;
  private listeners: Map<string, WebSocketEventListener[]> = new Map();
  private channels: Map<string, any> = new Map();

  constructor(url: string) {
    this.url = url;
    window.Pusher = Pusher;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.echo = new Echo({
          broadcaster: 'pusher',
          key: import.meta.env.VITE_SOCKET_KEY,
          wsHost: this.url.replace(/^https?:\/\//, '').split(':')[0],
          wsPort: parseInt(this.url.split(':').pop() || '8589'),
          wssPort: parseInt(this.url.split(':').pop() || '8589'),
          forceTLS: false,
          encrypted: false,
          disableStats: true,
          enabledTransports: ['ws', 'wss'],
          cluster: 'mt1',
          authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
          auth: {
            headers: {
              Authorization: `Bearer ${authSDK.getAccessToken() || ''}`,
            },
          },
        });

        // Simulate connection event
        setTimeout(() => {
          console.log('Laravel Echo connected');
          resolve();
        }, 1000);

      } catch (error) {
        console.error('Laravel Echo connection error:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }
    this.channels.clear();
  }

  send(type: string, data: any): void {
    if (this.echo) {
      console.log(`Broadcasting event ${type}:`, data);
      // Laravel Echo is primarily for listening, not sending
      // Broadcasting is typically done via HTTP API
    } else {
      console.warn('Laravel Echo is not connected');
    }
  }

  listen(channel: string, event: string, listener: WebSocketEventListener): void {
    if (!this.echo) {
      console.warn('Laravel Echo is not connected');
      return;
    }

    const channelInstance = this.echo.channel(channel);
    channelInstance.listen(event, listener);
    this.channels.set(`${channel}:${event}`, channelInstance);
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


  get isConnected(): boolean {
    return this.echo !== null;
  }
}

export const websocketService = new WebSocketService(
  import.meta.env.VITE_WS_URL || 'http://192.168.1.14:8589'
);
