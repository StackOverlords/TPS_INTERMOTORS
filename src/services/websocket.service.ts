import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

export class WebSocketService {
  private echo: Echo<any> | null = null;

  // Guardamos las instancias de canales para no duplicar suscripciones
  private channels: Map<string, any> = new Map();

  constructor() {
    window.Pusher = Pusher;
  }

  /**
   * Inicializa la conexión con Reverb
   */
  connect(): Promise<void> {
    if (this.echo) {
      // console.log('⚠️ Echo ya está conectado');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
        const port = import.meta.env.VITE_REVERB_PORT || '8080';
        const appKey = import.meta.env.VITE_REVERB_APP_KEY;
        const scheme = import.meta.env.VITE_REVERB_SCHEME || 'ws';
        const useTLS = scheme === 'https' || scheme === 'wss';

        // console.log('🔌 Configurando conexión a Reverb:', {
        //   host,
        //   port,
        //   appKey,
        //   scheme,
        //   useTLS
        // });

        // Configuración correcta para Reverb compatible con Pusher
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
          cluster: 'mt1', // Requerido por Pusher.js aunque Reverb no lo use

          // Configuración adicional para Reverb
          auth: {
            headers: {
              // Aquí vamosss a agregar headers de autenticación si es necesario
              // 'Authorization': `Bearer ${token}`
            },
          },
        });

        // console.log('📡 Echo instance created, waiting for connection...');

        // Escuchar eventos de conexión
        this.echo.connector.pusher.connection.bind('connected', () => {
            // console.log('✅ Conectado a Reverb WebSocket');
            // console.log('📊 Socket ID:', this.echo?.socketId());
            resolve();
        });

        this.echo.connector.pusher.connection.bind('error', (err: any) => {
            console.error('❌ Error en la conexión:', err);
        });

        this.echo.connector.pusher.connection.bind('failed', (err: any) => {
            console.error('❌ Falló la conexión a Reverb:', err);
            reject(new Error(`Failed to connect: ${JSON.stringify(err)}`));
        });

        this.echo.connector.pusher.connection.bind('disconnected', () => {
            // console.log('⚠️ Desconectado de Reverb');
        });

        this.echo.connector.pusher.connection.bind('state_change', (states: any) => {
            // console.log('🔄 Estado de conexión cambió:', states.previous, '->', states.current);
        });

      } catch (error) {
        console.error('💥 Error inicializando Echo:', error);
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

  /**
   * Escuchar un evento en un canal
   * @param channelName - Nombre del canal (ej: 'public-updates', 'private-orders', 'presence-chat')
   * @param eventName - Nombre del evento (ej: 'public.notification', 'OrderCreated', '.OrderUpdated')
   * @param callback - Función a ejecutar cuando se reciba el evento
   */
  listen(channelName: string, eventName: string, callback: Function): void {
    if (!this.echo) {
      console.warn('⚠️ Echo no está conectado. Llama a connect() primero.');
      return;
    }

    // console.log(`🎯 Intentando suscribirse a canal: "${channelName}" con evento: "${eventName}"`);

    // Reutilizar instancia del canal si ya existe
    let channel = this.channels.get(channelName);

    if (!channel) {
      // Determinar el tipo de canal basado en el nombre
      if (channelName.startsWith('private-')) {
        const privateChannelName = channelName.replace('private-', '');
        // // console.log(`🔒 Creando canal privado: ${privateChannelName}`);
        channel = this.echo.private(privateChannelName);
      } else if (channelName.startsWith('presence-')) {
        const presenceChannelName = channelName.replace('presence-', '');
        // // console.log(`👥 Creando canal de presencia: ${presenceChannelName}`);
        channel = this.echo.join(presenceChannelName);
      } else {
        // // console.log(`📢 Creando canal público: ${channelName}`);
        channel = this.echo.channel(channelName);
      }

      this.channels.set(channelName, channel);

      // Escuchar eventos de suscripción
      channel.on('pusher:subscription_succeeded', () => {
        // console.log(`✅ Suscripción exitosa al canal: ${channelName}`);
      });

      channel.on('pusher:subscription_error', (error: any) => {
        console.error(`❌ Error al suscribirse al canal ${channelName}:`, error);
      });
    }

    // Formatear el nombre del evento correctamente
    // Si el evento ya tiene un punto al inicio, no agregar otro
    // Si no, agregarlo para que Laravel Echo lo maneje correctamente
    const formattedEvent = eventName.startsWith('.') ? eventName : `.${eventName}`;

    channel.listen(formattedEvent, (data: any) => {
      // console.log(`📨 Evento recibido [${channelName}] [${eventName}]:`, data);
      callback(data);
    });

    // console.log(`🎧 Escuchando evento "${formattedEvent}" en canal "${channelName}"`);
  }

  /**
   * Dejar de escuchar un canal completo
   */
  leave(channelName: string): void {
    if (this.echo) {
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