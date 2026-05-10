/**
 * Proveedor raíz del módulo de mensajería.
 * Wires:
 *  - Carga inicial de chats
 *  - Suscripciones WebSocket / polling fallback
 *  - Sincronización de cola offline
 *  - Inicialización del listener de red
 */

import type { ReactNode } from "react";
import { useEffect } from "react";
// import { useWebSocket } from '@/contexts/WebSocketContext';
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

interface MessagingProviderProps {
  children: ReactNode;
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  // ── Cargar chats al montar ─────────────────────────────────────────────────
  const { chats } = useChats();

  // ── Estado de conexión Echo ────────────────────────────────────────────────
  const isEchoConnected = useEchoConnectionState();
  const queryClient = useQueryClient();

  // ── Suscripciones WebSocket + polling fallback ─────────────────────────────
  useMessagingWebSocket(chats, isEchoConnected);

  // ── Cola offline ───────────────────────────────────────────────────────────
  useOfflineQueue();

  // ── Listener de red (online/offline) + init Tauri store ───────────────────
  useEffect(() => {
    const cleanup = initOfflineListener();
    // Limpiar borradores expirados al montar (al inicio de sesión)
    useDraftStore.getState().pruneExpired();
    return cleanup;
  }, []);

  // ── Limpiar estado completo al logout ────────────────────────────────────
  // Cuando authSDK detecta que no hay usuario (logout, expiración, cambio de cuenta),
  // reseteamos todo el estado de mensajería para que el próximo usuario comience limpio.
  useEffect(() => {
    const unsubscribe = authSDK.onAuthStateChanged((state) => {
      if (!state.user) {
        useChatStore.getState().reset();
        useChatUIStore.getState().close();
        useOfflineQueueStore.setState({ queue: [] });
        useDraftStore.getState().clearAllDrafts();
        void queryClient.removeQueries({ queryKey: ["messaging"] });
        void queryClient.removeQueries({ queryKey: ["users-infinite"] });
      }
    });
    return () => unsubscribe();
  }, [queryClient]);

  return <>{children}</>;
}
