import { useMutation } from "@tanstack/react-query";
import { useChatStore } from "../stores/ChatStore";
import { messageService } from "../service/Message.service";

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
      // Eliminar del store inmediatamente (optimista)
      deleteMessageInStore(chatId, messageId, "remove");
    },
    onError: (_err, messageId) => {
      // En error no recuperamos el mensaje — es difícil revertir
      // y el usuario puede recargar si lo necesita.
      console.error("[useDeleteMessage] Failed to delete for all", messageId);
    },
  });

  const deleteForMe = useMutation<void, Error, number>({
    mutationFn: (messageId) => messageService.deleteForMe(chatId, messageId),
    onMutate: (messageId) => {
      // Ocultar localmente (modo 'hide') — sin sacar del array
      deleteMessageInStore(chatId, messageId, "hide");
    },
    onError: (_err, messageId) => {
      console.error("[useDeleteMessage] Failed to delete for me", messageId);
    },
  });

  return { deleteForAll, deleteForMe };
}
