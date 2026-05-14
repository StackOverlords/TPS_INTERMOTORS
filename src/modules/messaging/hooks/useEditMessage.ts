import { useMutation } from "@tanstack/react-query";
import { useChatStore } from "../stores/ChatStore";
import { messageService } from "../service/Message.service";
import type { EditMessagePayload, Message } from "../types/Message.types";

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
export function useEditMessage(chatId: number) {
  const editMessageInStore = useChatStore((s) => s.editMessage);

  return useMutation<
    Message,
    Error,
    { messageId: number; payload: EditMessagePayload; previousContent?: string }
  >({
    mutationFn: ({ messageId, payload }) =>
      messageService.edit(chatId, messageId, payload),

    onMutate: ({ messageId, payload }) => {
      // Optimista: actualizar store antes de que el servidor responda
      editMessageInStore(chatId, messageId, {
        contenido: payload.contenido,
        editado: true,
        fecha_editado: new Date().toISOString(),
      });
    },

    onSuccess: (message) => {
      // Confirmar con los valores exactos del servidor
      editMessageInStore(chatId, message.id, {
        contenido: message.contenido,
        editado: message.editado,
        fecha_editado: message.fecha_editado ?? new Date().toISOString(),
      });
    },

    onError: (_err, { messageId, previousContent }) => {
      // Revertir si falló — solo si teníamos el contenido previo
      if (previousContent !== undefined) {
        editMessageInStore(chatId, messageId, {
          contenido: previousContent,
          editado: false,
          fecha_editado: "",
        });
      }
    },
  });
}
