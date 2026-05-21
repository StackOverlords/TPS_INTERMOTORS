import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useChatStore } from "../stores/ChatStore";
import { messageService } from "../service/Message.service";
import type { Chat, LastMessagePreview } from "../types/Chat.types";
import { messagesQueryKey } from "./useMessages";
import type { Message, MessagesGetAllResponse } from "../types/Message.types";

/**
 * Eliminar un mensaje.
 *
 * Dos modos:
 *  - "forAll" → DELETE ?para_todos=1 → genera .message.deleted broadcast
 *               Solo remitente (24h) o OWNER/ADMIN (sin límite).
 *  - "forMe"  → DELETE sin param → sin broadcast, solo local.
 *               Cualquier participante puede hacerlo.
 *
 * La eliminación es optimista: el store se actualiza antes de la llamada HTTP.
 */

type MessagesCache = InfiniteData<MessagesGetAllResponse>;

type DeleteForAllContext = {
  snapshot: Message | undefined;
  previousUltimoMensaje: Chat["ultimo_mensaje"] | undefined;
};

export function useDeleteMessage(chatId: number) {
  const deleteMessageInStore = useChatStore((s) => s.deleteMessage);
  const qc = useQueryClient();

  const deleteForAll = useMutation<void, Error, number, DeleteForAllContext>({
    mutationFn: (messageId) => messageService.deleteForAll(chatId, messageId),
    onMutate: (messageId): DeleteForAllContext => {
      // ── Guardar snapshot antes de modificar ──────────────────────────────
      const msgs = useChatStore.getState().messagesByChatId[chatId] ?? [];
      const snapshot = msgs.find(
        (m) => !("_tempId" in m) && m.id === messageId,
      ) as Message | undefined;

      const chatInStore = useChatStore
        .getState()
        .chats.find((c) => c.id === chatId);
      const previousUltimoMensaje = chatInStore?.ultimo_mensaje ?? undefined;

      deleteMessageInStore(chatId, messageId, "remove");

      // filtrar el mensaje de todas las páginas
      qc.setQueryData<MessagesCache>(messagesQueryKey(chatId), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((m) => m.id !== messageId),
          })),
        };
      });

      // Calcular el nuevo ultimo_mensaje desde el store local
      // (suficiente para para_todos porque el WebSocket lo confirmará)
      useChatStore.setState((state) => {
        const chatIdx = state.chats.findIndex((c) => c.id === chatId);
        if (chatIdx < 0) return;
        if (state.chats[chatIdx].ultimo_mensaje?.id !== messageId) return;

        const msgs = state.messagesByChatId[chatId] ?? [];
        const previous = [...msgs]
          .reverse()
          .find((m) => !("_tempId" in m) && m.id !== messageId);

        state.chats[chatIdx].ultimo_mensaje = previous
          ? {
              id: previous.id,
              contenido: previous.contenido,
              remitente: previous.remitente,
              fecha_reg: previous.fecha_reg,
              referencia_tipo: previous.referencia_tipo,
              referencia_id: previous.referencia_id,
              es_sistema: previous.es_sistema,
              editado: previous.editado,
              fecha_editado: previous.fecha_editado ?? null,
            }
          : null;
      });

      return { snapshot, previousUltimoMensaje };
    },
    onError: (_err, _messageId, context) => {
      if (!context) return;

      // ── Revertir: restaurar el mensaje eliminado y el ultimo_mensaje ──────
      if (context.snapshot) {
        useChatStore.getState().appendMessage(chatId, context.snapshot);
      }

      useChatStore.setState((state) => {
        const idx = state.chats.findIndex((c) => c.id === chatId);
        if (idx >= 0 && context.previousUltimoMensaje !== undefined) {
          state.chats[idx].ultimo_mensaje = context.previousUltimoMensaje;
        }
      });

      // Refrescar cache desde el servidor para asegurar consistencia
      void qc.invalidateQueries({ queryKey: messagesQueryKey(chatId) });
    },
  });

  const deleteForMe = useMutation<
    { latest_message: LastMessagePreview | null },
    Error,
    number
  >({
    mutationFn: (messageId) => messageService.deleteForMe(chatId, messageId),
    onMutate: (messageId) => {
      deleteMessageInStore(chatId, messageId, "hide");

      qc.setQueryData<MessagesCache>(messagesQueryKey(chatId), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((m) =>
              m.id === messageId ? { ...m, eliminado: true } : m,
            ),
          })),
        };
      });
    },
    onSuccess: ({ latest_message }) => {
      // Actualizar ultimo_mensaje con lo que dice el backend
      useChatStore.setState((state) => {
        const idx = state.chats.findIndex((c) => c.id === chatId);
        if (idx >= 0) {
          state.chats[idx].ultimo_mensaje = latest_message;
        }
      });
    },
    onError: (_err, messageId) => {
      console.error("[useDeleteMessage] Failed to delete for me", messageId);
    },
  });

  return { deleteForAll, deleteForMe };
}
