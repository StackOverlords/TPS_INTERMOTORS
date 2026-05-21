import { useMutation } from "@tanstack/react-query";
import { useChatStore } from "../stores/ChatStore";
import { chatService } from "../service/Chat.service";

/**
 * Marca un chat como leído:
 *  1. Actualiza el store local inmediatamente (optimistic)
 *  2. Llama al endpoint PATCH /messaging/chats/{id}/read
 */
export function useMarkAsRead() {
  const resetUnread = useChatStore((s) => s.resetUnread);

  return useMutation({
    mutationFn: (chatId: number) => chatService.markAsRead(chatId),
    onMutate: (chatId) => {
      if (!chatId || chatId <= 0) return;
      // Actualización optimista inmediata
      resetUnread(chatId);
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
