import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "../stores/ChatStore";
import { chatService } from "../service/Chat.service";
import { CHATS_QUERY_KEY } from "./useChats";
import type { Chat, UpdateChatPayload } from "../types/Chat.types";

/**
 * Editar nombre/descripción de un grupo.
 *
 * Solo permitido para OWNER o ADMIN, solo en tipo GROUP.
 * El backend crea automáticamente un mensaje de sistema en el chat
 * y hace broadcast de .chat.updated a todos los participantes.
 *
 * El store se actualiza optimistamente y se confirma con la respuesta.
 */
export function useEditChat(chatId: number) {
  const updateChatInfo = useChatStore((s) => s.updateChatInfo);
  // const upsertChat = useChatStore((s) => s.upsertChat);
  const qc = useQueryClient();

  return useMutation<
    Chat,
    Error,
    UpdateChatPayload,
    { previousNombre?: string; previousDescripcion?: string | null }
  >({
    mutationFn: (payload) => chatService.update(chatId, payload),

    onMutate: (payload) => {
      // Snapshot para revertir
      const chat = useChatStore.getState().chats.find((c) => c.id === chatId);
      const previousNombre = chat?.nombre;
      const previousDescripcion = chat?.descripcion;

      // Actualizar optimistamente
      updateChatInfo(chatId, {
        nombre: payload.nombre,
        descripcion: payload.descripcion,
      });

      return { previousNombre, previousDescripcion };
    },

    onSuccess: (_chat) => {
      // Confirmar con datos del servidor (puede incluir mensaje sistema, etc.)
      // upsertChat(chat);
      void qc.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
    },

    onError: (_err, _payload, context) => {
      // Revertir
      if (context) {
        updateChatInfo(chatId, {
          nombre: context.previousNombre,
          descripcion: context.previousDescripcion,
        });
      }
      console.error("[useEditChat] Failed to update chat", chatId);
    },
  });
}
