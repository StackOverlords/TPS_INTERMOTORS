import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useChatStore } from "../stores/ChatStore";
import { messageService } from "../service/Message.service";
import type {
  EditMessagePayload,
  Message,
  MessagesGetAllResponse,
} from "../types/Message.types";
import { messagesQueryKey } from "./useMessages";

/**
 * Editar el contenido de un mensaje.
 *
 * Restricciones (validadas también en el backend):
 *  - Solo el remitente puede editar
 *  - Solo mensajes tipo TEXT
 *  - Solo dentro de las primeras 24 horas
 *
 * Flujo optimista:
 *  1. onMutate → actualiza el store inmediatamente
 *  2. onSuccess → confirma con la respuesta del servidor
 *  3. onError → revierte al contenido original
 */

type MessagesCache = InfiniteData<MessagesGetAllResponse>;

export function useEditMessage(chatId: number) {
  const editMessageInStore = useChatStore((s) => s.editMessage);
  const qc = useQueryClient();

  const patchCache = (messageId: number, updates: Partial<Message>) => {
    qc.setQueryData<MessagesCache>(messagesQueryKey(chatId), (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.map((m) =>
            m.id === messageId ? { ...m, ...updates } : m,
          ),
        })),
      };
    });
  };

  return useMutation<
    Message,
    Error,
    { messageId: number; payload: EditMessagePayload; previousContent?: string }
  >({
    mutationFn: ({ messageId, payload }) =>
      messageService.edit(chatId, messageId, payload),

    onMutate: ({ messageId, payload }) => {
      // Optimista: actualizar store antes de que el servidor responda
      const optimisticUpdates = {
        contenido: payload.contenido,
        editado: true,
        fecha_editado: new Date().toISOString(),
      };
      editMessageInStore(chatId, messageId, optimisticUpdates);
      patchCache(messageId, optimisticUpdates);
    },

    onSuccess: (message) => {
      // Confirmar con los valores exactos del servidor
      const confirmedUpdates = {
        contenido: message.contenido,
        editado: message.editado,
        fecha_editado: message.fecha_editado ?? new Date().toISOString(),
      };
      editMessageInStore(chatId, message.id, confirmedUpdates);
      patchCache(message.id, confirmedUpdates);
    },

    onError: (_err, { messageId, previousContent }) => {
      // Revertir si falló — solo si teníamos el contenido previo
      if (previousContent !== undefined) {
        const revert = {
          contenido: previousContent,
          editado: false,
          fecha_editado: "",
        };
        editMessageInStore(chatId, messageId, revert);
        patchCache(messageId, revert);
      }
    },
  });
}
