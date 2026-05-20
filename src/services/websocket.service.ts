import Echo from "laravel-echo";
import Pusher from "pusher-js";
import authSDK from "@/services/sdk-simple-auth";
import { environment } from "@/utils/environment";
import logger from "@/utils/logger";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

const wsLogger = logger.withModule("WEBSOCKET");

export interface PresenceHandlers {
  here: (users: Array<{ id: number; [key: string]: unknown }>) => void;
  joining: (user: { id: number; [key: string]: unknown }) => void;
  leaving: (user: { id: number; [key: string]: unknown }) => void;
}

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

        const token = await authSDK.getValidAccessToken();

        wsLogger.info("Configurando conexión a Reverb", {
          host,
          port,
          appKey: appKey ? `${appKey.substring(0, 8)}...` : "NO_KEY",
          scheme,
          useTLS,
          authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
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
          cluster: "mt1",
          authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
          auth: {
            headers: {
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
          wsLogger.error("ERROR CONEXION", { status: "error", error: err });
        });

        this.echo.connector.pusher.connection.bind("failed", (err: any) => {
          wsLogger.error("CONEXION FALLIDA", { status: "failed", error: err });
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
   * Suscribirse a un evento en un canal (privado, presencia o público).
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
   * Los canales de presencia se manejan con joinPresence() — no usar este método
   * para los eventos here/joining/leaving.
   * @param channelName - Nombre del canal con prefijo de tipo (ej: 'private-chat.25', 'public-updates')
   * @param eventName   - Nombre del evento broadcast (ej: 'message.sent', '.OrderCreated')
   * @param callback    - Función a ejecutar cuando se reciba el evento; recibe el payload del evento
   */
  listen(
    channelName: string,
    eventName: string,
    callback: Function,
  ): () => void {
    if (!this.echo) {
      wsLogger.warn("Echo no conectado.", { channelName, eventName });
      return () => {};
    }

    wsLogger.debug("Intentando suscribirse a canal", {
      channelName,
      eventName,
    });

    // Reutilizar instancia del canal si ya existe
    let channel = this.channels.get(channelName);

    if (!channel) {
      if (channelName.startsWith("private-")) {
        const name = channelName.replace("private-", "");
        wsLogger.debug("Creando canal privado", { name });
        channel = this.echo.private(name);
      } else if (channelName.startsWith("presence-")) {
        const name = channelName.replace("presence-", "");
        wsLogger.debug("Creando canal de presencia", { name });
        channel = this.echo.join(name);
      } else {
        wsLogger.debug("Creando canal público", { channelName });
        channel = this.echo.channel(channelName);
      }

      this.channels.set(channelName, channel);

      // Escuchar eventos de suscripción
      channel.on("pusher:subscription_succeeded", () => {
        wsLogger.info("CANAL SUSCRITO", {
          channel: channelName,
          timestamp: new Date().toISOString(),
        });
      });

      channel.on("pusher:subscription_error", (error: any) => {
        wsLogger.error("ERROR SUSCRIPCION", { channel: channelName, error });
      });
    }

    const formattedEvent = eventName.startsWith(".")
      ? eventName
      : `.${eventName}`;

    channel.listen(formattedEvent, (data: any) => {
      wsLogger.info("EVENTO RECIBIDO", {
        channel: channelName,
        event: formattedEvent,
        data,
      });
      callback(data);
    });

    wsLogger.info("SUSCRIPCION ACTIVA", {
      channel: channelName,
      event: formattedEvent,
    });

    return () => {
      wsLogger.debug("Desuscribiendo evento", { channelName, formattedEvent });
      this.channels.get(channelName)?.stopListening(formattedEvent, callback);
    };
  }

  /**
   * Suscribirse al canal de presencia.
   * Maneja los tres callbacks propios del presence channel:
   *   here    → lista inicial de usuarios conectados
   *   joining → un usuario se conectó
   *   leaving → un usuario se desconectó
   *
   * @param channelName  Nombre sin prefijo (ej: 'users' para 'presence-users')
   * @param handlers     Callbacks de presencia
   * @returns  Función de limpieza que abandona el canal
   */
  joinPresence(channelName: string, handlers: PresenceHandlers): () => void {
    if (!this.echo) {
      wsLogger.warn(
        "Echo no conectado. No se puede unir al canal de presencia.",
        {
          channelName,
        },
      );
      return () => {};
    }

    const fullName = `presence-${channelName}`;

    let channel = this.channels.get(fullName);

    if (!channel) {
      channel = this.echo
        .join(channelName)
        .here((users: any[]) => {
          wsLogger.info("PRESENCE HERE", {
            channel: fullName,
            count: users.length,
          });
          handlers.here(users);
        })
        .joining((user: any) => {
          wsLogger.info("PRESENCE JOINING", { channel: fullName, user });
          handlers.joining(user);
        })
        .leaving((user: any) => {
          wsLogger.info("PRESENCE LEAVING", { channel: fullName, user });
          handlers.leaving(user);
        });

      this.channels.set(fullName, channel);

      channel.on?.("pusher:subscription_succeeded", () => {
        wsLogger.info("PRESENCE CANAL SUSCRITO", { channel: fullName });
      });

      channel.on?.("pusher:subscription_error", (err: any) => {
        wsLogger.error("PRESENCE ERROR SUSCRIPCION", {
          channel: fullName,
          err,
        });
      });
    }

    wsLogger.info("PRESENCE SUSCRIPCION ACTIVA", { channel: fullName });

    return () => {
      this.leave(fullName);
    };
  }

  leave(channelName: string): void {
    if (this.echo) {
      wsLogger.info("Dejando canal", { channelName });
      // Echo.leave() espera el nombre sin prefijo para canales de presencia
      // pero con prefijo para privados — normalizamos aquí.
      if (channelName.startsWith("presence-")) {
        this.echo.leave(channelName.replace("presence-", ""));
      } else if (channelName.startsWith("private-")) {
        this.echo.leave(channelName.replace("private-", ""));
      } else {
        this.echo.leave(channelName);
      }
      this.channels.delete(channelName);
    }
  }

  get isConnected(): boolean {
    return this.echo?.connector?.pusher?.connection?.state === "connected";
  }
}

export const websocketService = new WebSocketService();
