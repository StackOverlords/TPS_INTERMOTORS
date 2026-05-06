import Echo from "laravel-echo";
import Pusher from "pusher-js";
import authSDK from "@/services/sdk-simple-auth";
import logger from "@/utils/logger";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

const wsLogger = logger.withModule("WEBSOCKET");

export class WebSocketService {
  private echo: Echo<any> | null = null;

  // Guardamos las instancias de canales para no duplicar suscripciones
  private channels: Map<string, any> = new Map();

  constructor() {
    window.Pusher = Pusher;
    wsLogger.debug("WebSocketService inicializado");
  }

  /**
   * Inicializa la conexión con Reverb.
   *
   * El método es async internamente para poder obtener el token de acceso
   * ANTES de crear la instancia de Echo, lo que permite autenticar canales
   * privados (chat.{id}) correctamente desde el primer intento.
   *
   * Si Echo ya está conectado, retorna inmediatamente sin crear una nueva instancia.
   */
  connect(): Promise<void> {
    if (this.echo) {
      wsLogger.warn("Echo ya está conectado, ignorando nueva conexión");
      return Promise.resolve();
    }

    return this._initEcho();
  }

  /**
   * Método privado que encapsula la inicialización async de Echo.
   * Separado de connect() para mantener la firma pública sin cambios.
   */
  private async _initEcho(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const host =
          import.meta.env.VITE_REVERB_HOST || window.location.hostname;
        const port = import.meta.env.VITE_REVERB_PORT || "8589";
        const appKey = import.meta.env.VITE_REVERB_APP_KEY;
        const scheme = import.meta.env.VITE_REVERB_SCHEME || "http";
        const useTLS = scheme === "https" || scheme === "wss";
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

        // Obtener el token de acceso antes de crear Echo.
        // Necesario para que Pusher pueda autenticar los canales privados
        // (private-chat.{id}) enviando Authorization: Bearer {token}
        // al endpoint /broadcasting/auth del backend Laravel.
        const token = await authSDK.getAccessToken();

        wsLogger.info("Configurando conexión a Reverb", {
          host,
          port,
          appKey: appKey ? `${appKey.substring(0, 8)}...` : "NO_KEY",
          scheme,
          useTLS,
          hasToken: !!token,
        });

        // Configuración correcta para Reverb compatible con Pusher
        this.echo = new Echo({
          broadcaster: "pusher",
          key: appKey,
          wsHost: host,
          wsPort: parseInt(port),
          wssPort: parseInt(port),
          forceTLS: useTLS,
          encrypted: useTLS,
          disableStats: true,
          enabledTransports: useTLS ? ["wss"] : ["ws"],
          cluster: "mt1", // Requerido por Pusher.js aunque Reverb no lo use

          // Configuración de autenticación para canales privados.
          // El backend valida en routes/channels.php que el usuario
          // sea participante activo antes de autorizar la suscripción.
          // Endpoint registrado por BroadcastServiceProvider con middleware auth:sanctum.
          authEndpoint: `${appUrl}/broadcasting/auth`,
          auth: {
            headers: {
              // Token Bearer necesario para que /broadcasting/auth identifique
              // al usuario y pueda validar su acceso al canal solicitado.
              Authorization: token ? `Bearer ${token}` : "",
            },
          },
        });

        // Escuchar eventos de conexión
        this.echo.connector.pusher.connection.bind("connected", () => {
          wsLogger.info("CONEXION ESTABLECIDA", {
            status: "connected",
            host,
            port,
            timestamp: new Date().toISOString(),
          });
          resolve();
        });

        this.echo.connector.pusher.connection.bind("error", (err: any) => {
          wsLogger.error("ERROR CONEXION", {
            status: "error",
            error: err,
            host,
            port,
          });
        });

        this.echo.connector.pusher.connection.bind("failed", (err: any) => {
          wsLogger.error("CONEXION FALLIDA", {
            status: "failed",
            error: err,
            host,
            port,
          });
          reject(new Error(`Failed to connect: ${JSON.stringify(err)}`));
        });

        this.echo.connector.pusher.connection.bind("disconnected", () => {
          wsLogger.warn("DESCONECTADO", {
            status: "disconnected",
            timestamp: new Date().toISOString(),
          });
        });

        this.echo.connector.pusher.connection.bind(
          "state_change",
          (states: any) => {
            wsLogger.debug("ESTADO CAMBIO", {
              from: states.previous,
              to: states.current,
              timestamp: new Date().toISOString(),
            });
          },
        );
      } catch (error) {
        wsLogger.error("Error inicializando Echo", { error });
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.echo) {
      wsLogger.info("Desconectando WebSocket...");
      this.echo.disconnect();
      this.echo = null;
    }
    const channelCount = this.channels.size;
    this.channels.clear();
    wsLogger.info("WebSocket desconectado", { channelsCleared: channelCount });
  }

  /**
   * Suscribirse a un evento en un canal WebSocket.
   *
   * Convención de nombres de canal (el prefijo determina el tipo):
   *   - 'private-chat.25'      → echo.private('chat.25')       ← canal privado (requiere auth)
   *   - 'presence-room.25'     → echo.join('room.25')           ← canal de presencia
   *   - 'public-updates'       → echo.channel('public-updates') ← canal público (sin auth)
   *
   * El método reutiliza la instancia del canal si ya existe para evitar
   * suscripciones duplicadas al mismo canal.
   *
   * Convención de nombres de evento:
   *   - Los eventos de Laravel Broadcast se emiten con un punto al inicio: '.message.sent'
   *   - Si el eventName no empieza con '.', se agrega automáticamente.
   *   - Ejemplos: 'message.sent' → '.message.sent' | '.OrderCreated' → '.OrderCreated'
   *
   * @param channelName - Nombre del canal con prefijo de tipo (ej: 'private-chat.25', 'public-updates')
   * @param eventName   - Nombre del evento broadcast (ej: 'message.sent', '.OrderCreated')
   * @param callback    - Función a ejecutar cuando se reciba el evento; recibe el payload del evento
   */
  listen(channelName: string, eventName: string, callback: Function): () => void {
    if (!this.echo) {
      wsLogger.warn("Echo no está conectado. Llama a connect() primero.", {
        channelName,
        eventName,
      });
      return;
    }

    wsLogger.debug("Intentando suscribirse a canal", {
      channelName,
      eventName,
    });

    // Reutilizar instancia del canal si ya existe
    let channel = this.channels.get(channelName);

    if (!channel) {
      // Determinar el tipo de canal basado en el nombre
      if (channelName.startsWith("private-")) {
        const privateChannelName = channelName.replace("private-", "");
        wsLogger.debug("Creando canal privado", { privateChannelName });
        channel = this.echo.private(privateChannelName);
      } else if (channelName.startsWith("presence-")) {
        const presenceChannelName = channelName.replace("presence-", "");
        wsLogger.debug("Creando canal de presencia", { presenceChannelName });
        channel = this.echo.join(presenceChannelName);
      } else {
        wsLogger.debug("Creando canal público", { channelName });
        channel = this.echo.channel(channelName);
      }

      this.channels.set(channelName, channel);

      // Escuchar eventos de suscripción
      channel.on("pusher:subscription_succeeded", () => {
        wsLogger.info("CANAL SUSCRITO", {
          channel: channelName,
          status: "subscribed",
          timestamp: new Date().toISOString(),
        });
      });

      channel.on("pusher:subscription_error", (error: any) => {
        wsLogger.error("ERROR SUSCRIPCION", {
          channel: channelName,
          error,
          status: "failed",
        });
      });
    }

    // Formatear el nombre del evento correctamente.
    // Si el evento ya tiene un punto al inicio, no agregar otro.
    // Si no, agregarlo para que Laravel Echo lo maneje correctamente.
    const formattedEvent = eventName.startsWith(".")
      ? eventName
      : `.${eventName}`;

    channel.listen(formattedEvent, (data: any) => {
      wsLogger.info("EVENTO RECIBIDO", {
        channel: channelName,
        event: eventName,
        formattedEvent,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : [],
        data,
      });
      callback(data);
    });

    wsLogger.info("SUSCRIPCION ACTIVA", {
      channel: channelName,
      event: formattedEvent,
      status: "listening",
    });

    return () => {
      wsLogger.debug('Desuscribiendo evento', { channelName, formattedEvent });
      this.channels.get(channelName)?.stopListening(formattedEvent, callback);
    };
  }

  /**
   * Dejar de escuchar un canal completo y limpiar su instancia del mapa interno.
   * Útil para desuscribirse cuando el usuario cierra un chat o hace logout.
   *
   * @param channelName - Nombre del canal a abandonar (mismo nombre usado en listen())
   */
  leave(channelName: string): void {
    if (this.echo) {
      wsLogger.info("Dejando canal", { channelName });
      this.echo.leave(channelName);
      this.channels.delete(channelName);
    }
  }

  /**
   * Indica si la conexión WebSocket está activa.
   * Usa el estado interno de Pusher para una verificación más robusta,
   * en lugar de depender de flags locales que pueden quedar desactualizados.
   */
  get isConnected(): boolean {
    // Verificación más robusta usando el estado interno de Pusher
    return this.echo?.connector?.pusher?.connection?.state === "connected";
  }
}

export const websocketService = new WebSocketService();
