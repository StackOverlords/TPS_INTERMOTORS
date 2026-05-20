import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import logger from '@/utils/logger';
import { environment } from '@/utils/environment';
import authSDK from '@/services/sdk-simple-auth';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

const wsLogger = logger.withModule('WEBSOCKET');

export class WebSocketService {
  private echo: Echo<any> | null = null;

  // Guardamos las instancias de canales para no duplicar suscripciones
  private channels: Map<string, any> = new Map();

  constructor() {
    window.Pusher = Pusher;
    wsLogger.debug('WebSocketService inicializado');
  }

  /**
   * Inicializa la conexión con Reverb
   */
  connect(): Promise<void> {
    if (this.echo) {
      wsLogger.warn('Echo ya está conectado, ignorando nueva conexión');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
        const port = import.meta.env.VITE_REVERB_PORT || '8589';
        const appKey = import.meta.env.VITE_REVERB_APP_KEY;
        const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
        const useTLS = scheme === 'https' || scheme === 'wss';
        const token = await authSDK.getValidAccessToken();

        wsLogger.info('Configurando conexión a Reverb', {
          host,
          port,
          appKey: appKey ? `${appKey.substring(0, 8)}...` : 'NO_KEY',
          scheme,
          useTLS
        });

        this.echo = new Echo({
          broadcaster: 'pusher',
          key: appKey,
          wsHost: host,
          wsPort: parseInt(port),
          wssPort: parseInt(port),
          forceTLS: useTLS,
          encrypted: useTLS,
          disableStats: true,
          enabledTransports: useTLS ? ['wss'] : ['ws'],
          cluster: 'mt1',
          authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
          auth: {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          },
        });

        // Escuchar eventos de conexión
        this.echo.connector.pusher.connection.bind('connected', () => {
            wsLogger.info('CONEXION ESTABLECIDA', {
              status: 'connected',
              host,
              port,
              timestamp: new Date().toISOString()
            });
            resolve();
        });

        this.echo.connector.pusher.connection.bind('error', (err: any) => {
            wsLogger.error('ERROR CONEXION', {
              status: 'error',
              error: err,
              host,
              port
            });
        });

        this.echo.connector.pusher.connection.bind('failed', (err: any) => {
            wsLogger.error('CONEXION FALLIDA', {
              status: 'failed',
              error: err,
              host,
              port
            });
            reject(new Error(`Failed to connect: ${JSON.stringify(err)}`));
        });

        this.echo.connector.pusher.connection.bind('disconnected', () => {
            wsLogger.warn('DESCONECTADO', {
              status: 'disconnected',
              timestamp: new Date().toISOString()
            });
        });

        this.echo.connector.pusher.connection.bind('state_change', (states: any) => {
            wsLogger.debug('ESTADO CAMBIO', {
              from: states.previous,
              to: states.current,
              timestamp: new Date().toISOString()
            });
        });

      } catch (error) {
        wsLogger.error('Error inicializando Echo', { error });
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.echo) {
      wsLogger.info('Desconectando WebSocket...');
      this.echo.disconnect();
      this.echo = null;
    }
    const channelCount = this.channels.size;
    this.channels.clear();
    wsLogger.info('WebSocket desconectado', { channelsCleared: channelCount });
  }

  /**
   * Escuchar un evento en un canal
   * @param channelName - Nombre del canal (ej: 'public-updates', 'private-orders', 'presence-chat')
   * @param eventName - Nombre del evento (ej: 'public.notification', 'OrderCreated', '.OrderUpdated')
   * @param callback - Función a ejecutar cuando se reciba el evento
   */
  listen(channelName: string, eventName: string, callback: Function): () => void {
    if (!this.echo) {
      wsLogger.warn('Echo no está conectado. Llama a connect() primero.', { channelName, eventName });
      return () => {};
    }

    wsLogger.debug('Intentando suscribirse a canal', { channelName, eventName });

    // Reutilizar instancia del canal si ya existe
    let channel = this.channels.get(channelName);

    if (!channel) {
      // Determinar el tipo de canal basado en el nombre
      if (channelName.startsWith('private-')) {
        const privateChannelName = channelName.replace('private-', '');
        wsLogger.debug('Creando canal privado', { privateChannelName });
        channel = this.echo.private(privateChannelName);
      } else if (channelName.startsWith('presence-')) {
        const presenceChannelName = channelName.replace('presence-', '');
        wsLogger.debug('Creando canal de presencia', { presenceChannelName });
        channel = this.echo.join(presenceChannelName);
      } else {
        wsLogger.debug('Creando canal público', { channelName });
        channel = this.echo.channel(channelName);
      }

      this.channels.set(channelName, channel);

      channel.on('pusher:subscription_succeeded', () => {
        wsLogger.info('CANAL SUSCRITO', {
          channel: channelName,
          status: 'subscribed',
          timestamp: new Date().toISOString()
        });
      });

      channel.on('pusher:subscription_error', (error: any) => {
        wsLogger.error('ERROR SUSCRIPCION', {
          channel: channelName,
          error,
          status: 'failed'
        });
      });
    }

    const formattedEvent = eventName.startsWith('.') ? eventName : `.${eventName}`;

    channel.listen(formattedEvent, (data: any) => {
      wsLogger.info('EVENTO RECIBIDO', {
        channel: channelName,
        event: eventName,
        formattedEvent,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : [],
        data
      });
      callback(data);
    });

    wsLogger.info('SUSCRIPCION ACTIVA', {
      channel: channelName,
      event: formattedEvent,
      status: 'listening'
    });

    return () => {
      wsLogger.debug('Desuscribiendo evento', { channelName, formattedEvent });
      this.channels.get(channelName)?.stopListening(formattedEvent, callback);
    };
  }

  /**
   * Dejar de escuchar un canal completo
   */
  leave(channelName: string): void {
    if (this.echo) {
      wsLogger.info('Dejando canal', { channelName });
      this.echo.leave(channelName);
      this.channels.delete(channelName);
    }
  }

  get isConnected(): boolean {
    // Verificación más robusta usando el estado interno de Pusher
    return this.echo?.connector?.pusher?.connection?.state === 'connected';
  }
}

export const websocketService = new WebSocketService();