import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { CHATS_QUERY_KEY } from "./useChats";
import { useChatStore } from "../stores/ChatStore";
import { useOfflineQueueStore } from "../stores/OfflineQueueStore";
import { useDraftStore } from "../stores/DraftStore";
import type {
  OptimisticMessage,
  SendMessagePayload,
} from "../types/Message.types";
import { chatService } from "../service/Chat.service";
import { messageService } from "../service/Message.service";

interface SendMessageContext {
  tempId: string;
  chatId: number;
}

/**
 * Envía un mensaje con soporte para:
 *  - Creación lazy de chat directo (pendingDirectChat)
 *  - Mensajes optimistas
 *  - Cola offline
 *  - Limpieza de borrador al enviar
 *
 * Flujo lazy (primer mensaje a usuario nuevo):
 *  1. POST /messaging/chats/direct  → obtiene el chatId real
 *  2. Agrega el mensaje optimista al store con el chatId real
 *  3. POST /messaging/chats/{id}/messages
 *  4. Limpia pendingDirectChat y activa el chat real
 */
export function useSendMessage(chatId: number) {
  const appendMessage = useChatStore((s) => s.appendMessage);
  const replaceOptimistic = useChatStore((s) => s.replaceOptimisticMessage);
  const markFailed = useChatStore((s) => s.markOptimisticAsFailed);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const upsertChat = useChatStore((s) => s.upsertChat);
  const pendingDirectChat = useChatStore((s) => s.pendingDirectChat);
  const setPending = useChatStore((s) => s.setPendingDirectChat);
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const enqueue = useOfflineQueueStore((s) => s.enqueue);
  const clearDraft = useDraftStore((s) => s.clearDraft);
  const qc = useQueryClient();

  // ── Pending mode: chatId es 0 porque el chat aún no existe ────────────────

  const sendPending = useCallback(
    async (payload: SendMessagePayload) => {
      if (!pendingDirectChat) return;
      const { userId } = pendingDirectChat;

      // 1. Crear el chat en el backend
      const chat = await chatService.createDirect({ usuario_id: userId });
      upsertChat(chat);
      setActiveChatId(chat.id);
      setPending(null);

      // 2. Limpiar borrador si existía para el pending (no tiene chatId real)
      //    Una vez creado el chat, el draft para ese chatId no existe aún.

      // 3. Enviar el mensaje en el chat recién creado
      const tempId = nanoid();
      const optimistic: OptimisticMessage = {
        id: -Date.now(),
        chat_id: chat.id,
        tipo: "TEXT",
        contenido: payload.contenido,
        referencia_tipo: payload.referencia_tipo ?? null,
        referencia_id: payload.referencia_id ?? null,
        remitente: null,
        es_sistema: false,
        editado: false,
        fecha_reg: new Date().toISOString(),
        _tempId: tempId,
        _status: "sending",
      };
      appendMessage(chat.id, optimistic);

      try {
        const message = await messageService.send(chat.id, payload);
        replaceOptimistic(chat.id, tempId, message);
        void qc.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
      } catch {
        markFailed(chat.id, tempId);
      }
    },
    [
      pendingDirectChat,
      upsertChat,
      setActiveChatId,
      setPending,
      appendMessage,
      replaceOptimistic,
      markFailed,
      qc,
    ],
  );

  // ── Normal mode: chatId ya existe ─────────────────────────────────────────

  const mutation = useMutation<
    Awaited<ReturnType<typeof messageService.send>>,
    Error,
    SendMessagePayload,
    SendMessageContext
  >({
    mutationFn: (payload) => messageService.send(chatId, payload),

    onMutate: (payload): SendMessageContext => {
      const tempId = nanoid();
      const now = new Date().toISOString();

      const optimistic: OptimisticMessage = {
        id: -Date.now(), // ID temporal negativo para no colisionar
        chat_id: chatId,
        tipo: "TEXT",
        contenido: payload.contenido,
        referencia_tipo: payload.referencia_tipo ?? null,
        referencia_id: payload.referencia_id ?? null,
        remitente: null, // se rellenará con el usuario actual en el componente
        es_sistema: false,
        editado: false,
        fecha_reg: now,
        _tempId: tempId,
        _status: "sending",
      };

      appendMessage(chatId, optimistic);

      // Limpiar borrador al enviar
      clearDraft(chatId);

      return { tempId, chatId };
    },

    onSuccess: (message, _payload, context) => {
      replaceOptimistic(chatId, context.tempId, message);
    },

    onError: (error, payload, context) => {
      if (!context) return;

      if (!isOnline) {
        // Marcar como "queued" en vez de "failed" cuando offline
        const msgs = useChatStore.getState().messagesByChatId[chatId];
        const optimistic = msgs?.find(
          (m) =>
            "_tempId" in m &&
            (m as OptimisticMessage)._tempId === context.tempId,
        ) as OptimisticMessage | undefined;
        if (optimistic) optimistic._status = "queued";

        // Encolar para sincronización posterior
        void enqueue({
          tempId: context.tempId,
          chatId,
          payload,
          createdAt: new Date().toISOString(),
        });
      } else {
        markFailed(chatId, context.tempId);
        console.error(
          "[useSendMessage] Failed to send message:",
          error.message,
        );
      }
    },
  });

  // ── Unified send function ─────────────────────────────────────────────────

  const send = useCallback(
    (payload: SendMessagePayload) => {
      if (pendingDirectChat && chatId === 0) {
        void sendPending(payload);
      } else {
        mutation.mutate(payload);
      }
    },
    [pendingDirectChat, chatId, sendPending, mutation],
  );

  return {
    send,
    sendAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
