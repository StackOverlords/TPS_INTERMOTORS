import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CHATS_QUERY_KEY } from "./useChats";
import { useChatStore } from "../stores/ChatStore";
import { chatService } from "../service/Chat.service";

/**
 * Marca un chat como leído:
 *  1. Actualiza el store local inmediatamente (optimistic)
 *  2. Llama al endpoint PATCH /messaging/chats/{id}/read
 */
export function useMarkAsRead() {
  const resetUnread = useChatStore((s) => s.resetUnread);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: number) => chatService.markAsRead(chatId),
    onMutate: (chatId) => {
      // Actualización optimista inmediata
      resetUnread(chatId);
    },
    onSuccess: () => {
      // Invalidar query para que el servidor confirme el estado
      void queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
    },
    onError: (_, chatId) => {
      // En error no revertimos el store — la UI ya mostró 0 y el usuario
      // ya leyó los mensajes. El servidor se sincronizará en el próximo GET.
      console.warn(
        "[useMarkAsRead] Failed to sync read status for chat",
        chatId,
      );
    },
  });
}
