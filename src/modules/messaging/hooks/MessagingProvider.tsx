/**
 *  - useChats() sigue cargando los chats, pero ahora useMessagingWebSocket
 *    suscribe al canal personal y de presencia ANTES que a los canales de chat.
 *  - Restauración del último chat abierto desde localStorage.
 *  - Reset del PresenceStore al logout.
 */

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useChats } from "./useChats";
import {
  initOfflineListener,
  useOfflineQueueStore,
} from "../stores/OfflineQueueStore";
import {
  useEchoConnectionState,
  useMessagingWebSocket,
} from "./useMessagingWebSocket";
import { useOfflineQueue } from "./useOfflineQueue";
import { useQueryClient } from "@tanstack/react-query";
import authSDK from "@/services/sdk-simple-auth";
import { useChatStore } from "../stores/ChatStore";
import { useChatUIStore } from "../stores/ChatUiStore";
import { useDraftStore } from "../stores/DraftStore";
import { usePresenceStore } from "../stores/PresenceStore";
import { MESSAGING_USERS_QUERY_KEY } from "./useMessagingUsers";
import { usePresenceSync } from "./usePresenceSync";

interface MessagingProviderProps {
  children: ReactNode;
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  // ── Cargar chats al montar ─────────────────────────────────────────────────
  const { chats, isLoading: chatsLoading } = useChats();

  // ── Estado de conexión Echo ────────────────────────────────────────────────
  const isEchoConnected = useEchoConnectionState();
  const queryClient = useQueryClient();

  // ── Suscripciones WebSocket + polling fallback ─────────────────────────────
  // La suscripción al canal personal (user.{id}) y presencia (presence-users)
  // ocurre dentro del hook en cuanto isEchoConnected === true, sin esperar
  // a que `chats` esté cargado — garantiza el orden de init correcto.
  useMessagingWebSocket(chats, isEchoConnected);
  usePresenceSync();

  // ── Cola offline ───────────────────────────────────────────────────────────
  useOfflineQueue();

  // ── Listener de red + init Tauri store + prune drafts ─────────────────────
  useEffect(() => {
    const cleanup = initOfflineListener();
    useDraftStore.getState().pruneExpired();
    return cleanup;
  }, []);

  // ── Restaurar último chat abierto tras recarga ─────────────────────────────
  // Solo se intenta restaurar una vez: cuando los chats terminaron de cargar
  // y aún no hay ningún chat activo (el usuario no navegó a ninguno todavía).
  useEffect(() => {
    if (chatsLoading) return;
    if (chats.length === 0) return;

    const hasActiveChat =
      useChatStore.getState().activeChatId !== null ||
      useChatStore.getState().pendingDirectChat !== null;

    if (hasActiveChat) return;

    try {
      const lastChatId = localStorage.getItem("messaging_last_chat_id");
      if (!lastChatId) return;

      const id = parseInt(lastChatId, 10);
      if (isNaN(id)) return;

      // Verificar que el chat todavía existe en la lista del usuario
      const exists = chats.some((c) => c.id === id);
      if (exists) {
        useChatStore.getState().setActiveChatId(id);
      } else {
        // Chat ya no existe (fue eliminado, el usuario salió, etc.)
        localStorage.removeItem("messaging_last_chat_id");
      }
    } catch {
      // localStorage no disponible
    }
  }, [chatsLoading, chats]);

  // ── Limpiar estado completo al logout ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = authSDK.onAuthStateChanged((state) => {
      if (!state.user) {
        useChatStore.getState().reset();
        useChatUIStore.getState().close();
        useOfflineQueueStore.setState({ queue: [] });
        useDraftStore.getState().clearAllDrafts();
        usePresenceStore.getState().reset();
        void queryClient.removeQueries({ queryKey: ["messaging", "messages"] });
        void queryClient.removeQueries({ queryKey: MESSAGING_USERS_QUERY_KEY });
      }
    });
    return () => unsubscribe();
  }, [queryClient]);

  return <>{children}</>;
}
