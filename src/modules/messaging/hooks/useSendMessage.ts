import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useChatStore } from "../stores/ChatStore";
import { useOfflineQueueStore } from "../stores/OfflineQueueStore";
import { messageService } from "../service/Message.service";
import type {
  OptimisticMessage,
  SendMessagePayload,
} from "../types/Message.types";

interface SendMessageContext {
  tempId: string;
  chatId: number;
}

/**
 * Envía un mensaje con flujo optimista:
 *  1. Agrega el mensaje al store con estado "sending"
 *  2. POST al servidor
 *  3. Reemplaza el mensaje optimista con el real
 *  4. Si offline: encola el mensaje en el Tauri store para sincronizar después
 */
export function useSendMessage(chatId: number) {
  const appendMessage = useChatStore((s) => s.appendMessage);
  const replaceOptimisticMessage = useChatStore(
    (s) => s.replaceOptimisticMessage,
  );
  const markOptimisticAsFailed = useChatStore((s) => s.markOptimisticAsFailed);
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const enqueue = useOfflineQueueStore((s) => s.enqueue);

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
      return { tempId, chatId };
    },

    onSuccess: (message, _payload, context) => {
      replaceOptimisticMessage(chatId, context.tempId, message);
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

        if (optimistic) {
          (optimistic as OptimisticMessage)._status = "queued";
        }

        // Encolar para sincronización posterior
        void enqueue({
          tempId: context.tempId,
          chatId,
          payload,
          createdAt: new Date().toISOString(),
        });
      } else {
        markOptimisticAsFailed(chatId, context.tempId);
        console.error(
          "[useSendMessage] Failed to send message:",
          error.message,
        );
      }
    },
  });

  return {
    send: mutation.mutate,
    sendAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
