/**
 *  1. Canal personal  private-user.{myId}  → recibe .chat.added
 *  2. Canal presencia presence-users       → online/offline en tiempo real
 *  3. Por cada chat: .message.edited, .message.deleted, .chat.updated (además de .message.sent)
 *  4. Polling fallback sin cambios
 *
 * Orden de inicialización (según spec backend):
 *  ① Suscribir user.{myId}     (antes de cargar chats)
 *  ② Suscribir presence-users  (antes de cargar chats)
 *  ③ Cargar chats (useChats — lo hace MessagingProvider)
 *  ④ Suscribir private-chat.{id} por cada chat
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
      const isOwnMessage =
        !!currentUserId && message.remitente?.id === currentUserId;

      if (!isOwnMessage) {
        soundManager.play("received");
      }

      if (useChatStore.getState().activeChatId !== chatId && !isOwnMessage) {
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
    },
    [],
  );

  const handleMessageDeleted = useCallback(
    (chatId: number, event: MessageDeletedEvent) => {
      // Solo llega cuando para_todos=1 — eliminación "para mí" no genera evento
      useChatStore.getState().deleteMessage(chatId, event.id, "remove");
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

  // ── Canal personal user.{myId} — recibe .chat.added ───────────────────

  const userChannelSubscribed = useRef(false);

  useEffect(() => {
    if (!isEchoConnected || userChannelSubscribed.current) return;

    const currentUser = authSDK.getCurrentUser();
    if (!currentUser?.id) return;

    const channelName = `private-user.${currentUser.id}`;

    websocketService.listen(channelName, "chat.added", (chat: Chat) => {
      const { upsertChat } = useChatStore.getState();
      upsertChat(chat);
      // Suscribirse al canal del nuevo chat
      subscribeToChatChannel(chat.id);
    });

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

      subscribedChats.current.add(chatId);
      stopPolling(chatId);
    },
    [
      handleIncomingMessage,
      handleMessageEdited,
      handleMessageDeleted,
      handleChatUpdated,
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
