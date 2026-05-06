/**
 * useActiveChat.ts
 *
 * Hook compuesto para gestionar el chat activo.
 * Al "abrir" un chat:
 *  1. Establece el chat activo en el store
 *  2. Carga el historial de mensajes
 *  3. Marca como leído automáticamente
 *
 * Usar en el componente del panel de mensajes.
 */

import { useEffect } from "react";
import { useMessages, useChatMessages } from "./useMessages";
import { useMarkAsRead } from "./useMarkAsRead";
import { selectActiveChat, useChatStore } from "../stores/ChatStore";

export function useOpenChat(chatId: number) {
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const markAsRead = useMarkAsRead();

  const messages = useMessages(chatId);
  const allMessages = useChatMessages(chatId);

  useEffect(() => {
    setActiveChatId(chatId);

    // Marcar como leído al abrir
    markAsRead.mutate(chatId);

    return () => {
      // Al cerrar el panel no limpiamos el activeChatId aquí,
      // el componente padre lo hace cuando navega fuera
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  return {
    messages: allMessages,
    isLoadingMessages: messages.isLoading,
    isFetchingOlderMessages: messages.isFetchingNextPage,
    hasOlderMessages: messages.hasNextPage,
    loadOlderMessages: messages.fetchNextPage,
    totalMessages: messages.totalMessages,
  };
}

/**
 * Cierra el chat activo (limpia el estado)
 */
export function useCloseChat() {
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  return () => setActiveChatId(null);
}

/**
 * Lee el chat activo desde el store
 */
export function useActiveChat() {
  return useChatStore(selectActiveChat);
}
