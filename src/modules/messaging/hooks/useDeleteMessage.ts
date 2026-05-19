import { useMutation } from "@tanstack/react-query";
import { useChatStore } from "../stores/ChatStore";
import { messageService } from "../service/Message.service";
import type { LastMessagePreview } from "../types/Chat.types";

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
export function useDeleteMessage(chatId: number) {
  const deleteMessageInStore = useChatStore((s) => s.deleteMessage);

  const deleteForAll = useMutation<void, Error, number>({
    mutationFn: (messageId) => messageService.deleteForAll(chatId, messageId),
    onMutate: (messageId) => {
      deleteMessageInStore(chatId, messageId, "remove");

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
    },
    onError: (_err, messageId) => {
      console.error("[useDeleteMessage] Failed to delete for all", messageId);
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
