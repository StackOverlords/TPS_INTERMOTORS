/**
 * Se encarga de:
 *  1. Suscribir cada chat al canal privado `private-chat.{id}` via Laravel Echo/Reverb
 *  2. Activar polling fallback cuando Echo se desconecta
 *  3. Limpiar suscripciones al desmontar
 *
 * Se monta UNA SOLA VEZ en MessagingProvider, después de cargar los chats.
 */

import { websocketService } from "@/services/websocket.service";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Chat } from "../types/Chat.types";
import { messageExists, useChatStore } from "../stores/ChatStore";
import type { Message } from "../types/Message.types";
import { messageService } from "../service/Message.service";
import authSDK from "@/services/sdk-simple-auth";
import { soundManager } from "../utils/soundManager";

const POLL_INTERVAL_MS = 7000;
const ECHO_CHECK_INTERVAL_MS = 5000;

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

export function useMessagingWebSocket(chats: Chat[], isEchoConnected: boolean) {
  const pollingTimers = useRef<Map<number, ReturnType<typeof setInterval>>>(
    new Map(),
  );
  const subscribedChats = useRef<Set<number>>(new Set());

  // ── Leer del store SIN crear dependencias reactivas ────────────────────────
  // Usamos getState() directo para evitar que los callbacks se recreen
  // cada vez que el store cambia.

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
        // Sonido de mensaje recibido — siempre que sea de otro usuario,
        // independientemente de si el chat está abierto o no.
        // El soundManager ya verifica si está muteado o la pestaña está oculta.
        soundManager.play("received");
      }

      if (useChatStore.getState().activeChatId !== chatId && !isOwnMessage) {
        incrementUnread(chatId);
      }
    },
    [],
  ); // sin dependencias → nunca se recrea

  // ── Polling ────────────────────────────────────────────────────────────────

  const startPolling = useCallback(
    (chatId: number) => {
      if (pollingTimers.current.has(chatId)) return; // ya está corriendo

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
          // silenciar, el servicio ya loguea
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

  // ── IDs de chats como valor estable para comparar ─────────────────────────
  // En lugar de depender del array `chats` (referencia inestable),
  // derivamos un string de IDs que solo cambia cuando realmente cambian los chats.
  const chatIds = chats.map((c) => c.id).join(",");

  // ── Suscribir Echo cuando conecta o llegan nuevos chats ───────────────────
  useEffect(() => {
    if (!isEchoConnected || !chatIds) return;

    const ids = chatIds.split(",").map(Number);
    ids.forEach((chatId) => {
      if (subscribedChats.current.has(chatId)) return;

      websocketService.listen(
        `private-chat.${chatId}`,
        "message.sent",
        (data: Message) => handleIncomingMessage(chatId, data),
      );

      subscribedChats.current.add(chatId);
      stopPolling(chatId); // detener polling si estaba activo
    });
  }, [chatIds, isEchoConnected, handleIncomingMessage, stopPolling]);

  // ── Conmutar entre Echo y polling ─────────────────────────────────────────
  useEffect(() => {
    if (!chatIds) return;

    const ids = chatIds.split(",").map(Number);

    if (!isEchoConnected) {
      // Echo caído → arrancar polling para cada chat
      ids.forEach((chatId) => startPolling(chatId));
    } else {
      // Echo conectado → detener polling (Echo se encarga)
      stopAllPolling();
    }
  }, [isEchoConnected, chatIds, startPolling, stopAllPolling]);

  // ── Cleanup total al desmontar ─────────────────────────────────────────────
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
