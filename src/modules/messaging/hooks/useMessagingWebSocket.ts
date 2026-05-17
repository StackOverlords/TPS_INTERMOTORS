/**
 *  1. Canal personal  private-user.{myId}  → recibe .chat.added, .participant.removed (yo fui removido)
 *  2. Canal presencia presence-users       → online/offline en tiempo real
 *  3. Por cada chat: .message.sent, .message.edited, .message.deleted,
 *                    .chat.updated, .participant.removed (otro fue removido)
 */

import { websocketService } from "@/services/websocket.service";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Chat } from "../types/Chat.types";
import { messageExists, useChatStore } from "../stores/ChatStore";
import type {
  ChatUpdatedEvent,
  Message,
  MessageDeletedEvent,
  MessageEditedEvent,
} from "../types/Message.types";
import { messageService } from "../service/Message.service";
import authSDK from "@/services/sdk-simple-auth";
import { soundManager } from "../utils/soundManager";
import { usePresenceStore } from "../stores/PresenceStore";
import { messagingUserService } from "../service/MessagingUser.service";
import type { ParticipantRemovedEvent } from "../types/Participant.types";
import { resolveNotificationBehavior } from "../utils/messageNotifications";

const POLL_INTERVAL_MS = 7000;
const ECHO_CHECK_INTERVAL_MS = 5000;

// ─────────────────────────────────────────────────────────────────────────────
// ECHO CONNECTION STATE
// ─────────────────────────────────────────────────────────────────────────────

export function useEchoConnectionState(): boolean {
  const [isConnected, setIsConnected] = useState<boolean>(
    () => websocketService.isConnected,
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(websocketService.isConnected);
    }, ECHO_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return isConnected;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useMessagingWebSocket(chats: Chat[], isEchoConnected: boolean) {
  const pollingTimers = useRef<Map<number, ReturnType<typeof setInterval>>>(
    new Map(),
  );
  const subscribedChats = useRef<Set<number>>(new Set());

  // ── Handlers de mensajes ────────────────────────────────────────────────

  const handleIncomingMessage = useCallback(
    (chatId: number, message: Message) => {
      const { appendMessage, setLastMessageTimestamp, incrementUnread } =
        useChatStore.getState();

      if (messageExists(chatId, message.id)) return;

      appendMessage(chatId, message);
      setLastMessageTimestamp(chatId, message.fecha_reg);

      const currentUserId = Number(authSDK.getCurrentUser()?.id);

      const { badge, sound } = resolveNotificationBehavior(
        message,
        currentUserId,
      );

      if (sound) {
        soundManager.play("received");
      }

      // El badge solo aplica cuando el chat NO está activo en pantalla
      if (badge && useChatStore.getState().activeChatId !== chatId) {
        incrementUnread(chatId);
      }
    },
    [],
  );

  const handleMessageEdited = useCallback(
    (chatId: number, event: MessageEditedEvent) => {
      useChatStore.getState().editMessage(chatId, event.id, {
        contenido: event.contenido,
        editado: true,
        fecha_editado: event.fecha_editado,
      });

      // Si el editado es el último mensaje del chat, actualizar la preview
      useChatStore.setState((state) => {
        const idx = state.chats.findIndex((c) => c.id === chatId);
        if (idx >= 0 && state.chats[idx].ultimo_mensaje?.id === event.id) {
          state.chats[idx].ultimo_mensaje!.contenido = event.contenido;
          state.chats[idx].ultimo_mensaje!.editado = true;
          state.chats[idx].ultimo_mensaje!.fecha_editado = event.fecha_editado;
        }
      });
    },
    [],
  );

  const handleMessageDeleted = useCallback(
    (chatId: number, event: MessageDeletedEvent) => {
      useChatStore.getState().deleteMessage(chatId, event.id, "remove");

      useChatStore.setState((state) => {
        const idx = state.chats.findIndex((c) => c.id === chatId);
        if (idx >= 0) {
          state.chats[idx].ultimo_mensaje = event.latest_message ?? null;
        }
      });
    },
    [],
  );

  const handleChatUpdated = useCallback(
    (chatId: number, event: ChatUpdatedEvent) => {
      useChatStore.getState().updateChatInfo(chatId, {
        nombre: event.nombre,
        descripcion: event.descripcion,
      });
    },
    [],
  );

  /**
   * Llega por el canal del CHAT (private-chat.{chatId}).
   * Solo procesa si el removido NO soy yo — actualiza la lista de
   * participantes del grupo sin tocar el store de chats.
   * Si el removido soy yo, el canal personal lo maneja (evita doble acción).
   */
  const handleParticipantRemovedInChat = useCallback(
    (chatId: number, event: ParticipantRemovedEvent) => {
      const currentUserId = Number(authSDK.getCurrentUser()?.id);
      if (event.usuario_id === currentUserId) return; // lo gestiona el canal personal

      useChatStore
        .getState()
        .removeParticipantFromChat(chatId, event.usuario_id);
    },
    [],
  );

  /**
   * Llega por el canal PERSONAL (private-user.{myId}).
   * Significa que YO fui removido o salí del chat:
   *  - Elimina el chat del store (mensajes, timestamps, activeChatId si aplica)
   *  - Abandona el canal WebSocket del chat
   */
  const handleParticipantRemovedForMe = useCallback(
    (event: ParticipantRemovedEvent) => {
      const currentUserId = Number(authSDK.getCurrentUser()?.id);
      if (event.usuario_id !== currentUserId) return; // no debería pasar, pero por seguridad

      const chatId = event.chat_id;

      // Limpiar store
      useChatStore.getState().removeChat(chatId);

      // Abandonar el canal WebSocket y dejar de escuchar eventos
      websocketService.leave(`private-chat.${chatId}`);
      subscribedChats.current.delete(chatId);
      stopPolling(chatId);
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Canal personal user.{myId} ─────────────────────────────────────────

  const userChannelSubscribed = useRef(false);

  useEffect(() => {
    if (!isEchoConnected || userChannelSubscribed.current) return;

    const currentUser = authSDK.getCurrentUser();
    if (!currentUser?.id) return;

    const channelName = `private-user.${currentUser.id}`;

    // Chat nuevo al que fui invitado
    websocketService.listen(channelName, "chat.added", (chat: Chat) => {
      const { upsertChat } = useChatStore.getState();
      upsertChat(chat);
      // Suscribirse al canal del nuevo chat
      subscribeToChatChannel(chat.id);
    });

    // Fui removido / salí de un grupo
    websocketService.listen(
      channelName,
      "participant.removed",
      (data: ParticipantRemovedEvent) => handleParticipantRemovedForMe(data),
    );

    websocketService.listen(
      channelName,
      "message.deleted",
      (data: MessageDeletedEvent) => {
        const { deleteMessage } = useChatStore.getState();

        deleteMessage(data.chat_id, data.id, "remove");

        useChatStore.setState((state) => {
          const idx = state.chats.findIndex((c) => c.id === data.chat_id);
          if (idx >= 0) {
            state.chats[idx].ultimo_mensaje = data.latest_message ?? null;
            state.chats[idx].no_leidos =
              data.no_leidos ?? state.chats[idx].no_leidos;
          }
        });
      },
    );

    userChannelSubscribed.current = true;

    return () => {
      if (userChannelSubscribed.current) {
        websocketService.leave(channelName);
        userChannelSubscribed.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEchoConnected]);

  // ── Canal de presencia presence-users ──────────────────────────────────

  const presenceSubscribed = useRef(false);

  useEffect(() => {
    if (!isEchoConnected || presenceSubscribed.current) return;

    const { setInitialUsers, userJoined, userLeft } =
      usePresenceStore.getState();

    const cleanup = websocketService.joinPresence("users", {
      here: (users) => setInitialUsers(users),
      joining: (user) => userJoined(user),
      leaving: (user) => {
        userLeft(user);
        const currentUserId = authSDK.getCurrentUser()?.id;
        if (String(user.id) === String(currentUserId)) {
          messagingUserService.userLeave().catch(() => {});
        }
      },
    });

    presenceSubscribed.current = true;

    return () => {
      cleanup();
      presenceSubscribed.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEchoConnected]);

  // ── Helper: suscribir un chat a todos sus eventos ───────────────────────

  const subscribeToChatChannel = useCallback(
    (chatId: number) => {
      if (subscribedChats.current.has(chatId)) return;

      const channelName = `private-chat.${chatId}`;

      websocketService.listen(channelName, "message.sent", (data: Message) =>
        handleIncomingMessage(chatId, data),
      );

      websocketService.listen(
        channelName,
        "message.edited",
        (data: MessageEditedEvent) => handleMessageEdited(chatId, data),
      );

      websocketService.listen(
        channelName,
        "message.deleted",
        (data: MessageDeletedEvent) => handleMessageDeleted(chatId, data),
      );

      websocketService.listen(
        channelName,
        "chat.updated",
        (data: ChatUpdatedEvent) => handleChatUpdated(chatId, data),
      );

      // Un participante fue removido del grupo (o salió)
      websocketService.listen(
        channelName,
        "participant.removed",
        (data: ParticipantRemovedEvent) =>
          handleParticipantRemovedInChat(chatId, data),
      );

      subscribedChats.current.add(chatId);
      stopPolling(chatId);
    },
    [
      handleIncomingMessage,
      handleMessageEdited,
      handleMessageDeleted,
      handleChatUpdated,
      handleParticipantRemovedInChat,
    ], // eslint-disable-line
  );

  // ── Polling fallback ────────────────────────────────────────────────────

  const startPolling = useCallback(
    (chatId: number) => {
      if (pollingTimers.current.has(chatId)) return;

      const timer = setInterval(async () => {
        const since =
          useChatStore.getState().lastMessageTimestampByChatId[chatId];
        if (!since) return;

        try {
          const response = await messageService.poll(chatId, since);
          if (response.data.length > 0) {
            response.data.forEach((msg) => handleIncomingMessage(chatId, msg));
          }
          useChatStore
            .getState()
            .setLastMessageTimestamp(chatId, response.timestamp);
        } catch {
          // silenciar
        }
      }, POLL_INTERVAL_MS);

      pollingTimers.current.set(chatId, timer);
    },
    [handleIncomingMessage],
  );

  const stopPolling = useCallback((chatId: number) => {
    const timer = pollingTimers.current.get(chatId);
    if (timer) {
      clearInterval(timer);
      pollingTimers.current.delete(chatId);
    }
  }, []);

  const stopAllPolling = useCallback(() => {
    pollingTimers.current.forEach((timer) => clearInterval(timer));
    pollingTimers.current.clear();
  }, []);

  // ── IDs de chats como valor estable ─────────────────────────────────────

  const chatIds = chats.map((c) => c.id).join(",");

  // ── Suscribir Echo por cada chat ─────────────────────────────────────────

  useEffect(() => {
    if (!isEchoConnected || !chatIds) return;

    const ids = chatIds.split(",").map(Number);
    ids.forEach((chatId) => subscribeToChatChannel(chatId));
  }, [chatIds, isEchoConnected, subscribeToChatChannel]);

  // ── Conmutar Echo ↔ polling ───────────────────────────────────────────────

  useEffect(() => {
    if (!chatIds) return;

    const ids = chatIds.split(",").map(Number);

    if (!isEchoConnected) {
      ids.forEach((chatId) => startPolling(chatId));
    } else {
      stopAllPolling();
    }
  }, [isEchoConnected, chatIds, startPolling, stopAllPolling]);

  // ── Cleanup al desmontar ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      subscribedChats.current.forEach((chatId) => {
        websocketService.leave(`private-chat.${chatId}`);
      });
      subscribedChats.current.clear();
      stopAllPolling();
    };
  }, [stopAllPolling]);

  return {
    subscribedCount: subscribedChats.current.size,
    isPollingActive: pollingTimers.current.size > 0,
  };
}
