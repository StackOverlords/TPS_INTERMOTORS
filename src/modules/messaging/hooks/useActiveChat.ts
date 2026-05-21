/**
 * Hook compuesto para gestionar el chat activo.
 * Al "abrir" un chat:
 *  1. Establece el chat activo en el store
 *  2. Carga el historial de mensajes
 *  3. Marca como leído automáticamente
 *
 * Usar en el componente del panel de mensajes.
 */

import { useEffect, useRef } from "react";
import { useMessages, useChatMessages } from "./useMessages";
import { useMarkAsRead } from "./useMarkAsRead";
import { selectActiveChat, useChatStore } from "../stores/ChatStore";
import authSDK from "@/services/sdk-simple-auth";

const MARK_READ_DEBOUNCE_MS = 2000;

export function useOpenChat(chatId: number) {
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const markAsRead = useMarkAsRead();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  const messages = useMessages(chatId);
  const allMessages = useChatMessages(chatId);

  useEffect(() => {
    if (!chatId) return; // ← guard: no hacer nada para pending (chatId=0)
    isInitialLoadRef.current = true;
    setActiveChatId(chatId);

    // Marcar como leído al abrir
    markAsRead.mutate(chatId);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const prevCountRef = useRef(allMessages.length);

  useEffect(() => {
    const prev = prevCountRef.current;
    const curr = allMessages.length;
    prevCountRef.current = curr;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    if (curr <= prev || chatId <= 0) return;

    // ── Solo marcar como leído si llegaron mensajes de OTROS usuarios ──────
    // Los propios mensajes llegan de vuelta por WS (broadcast sin toOthers),
    const currentUserId = Number(authSDK.getCurrentUser()?.id);
    const newMessages = allMessages.slice(prev);
    const hasIncomingFromOther = newMessages.some(
      (m) => !("_tempId" in m) && m.remitente?.id !== currentUserId,
    );

    if (!hasIncomingFromOther) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      markAsRead.mutate(chatId);
      debounceRef.current = null;
    }, MARK_READ_DEBOUNCE_MS);
  }, [allMessages.length, chatId]); // eslint-disable-line react-hooks/exhaustive-deps

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
