import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChatStore } from "../stores/ChatStore";
import { chatService } from "../service/Chat.service";
import type { Chat } from "../types/Chat.types";
import authSDK from "@/services/sdk-simple-auth";

export const CHATS_QUERY_KEY = ["messaging", "chats"] as const;

/**
 * Carga todos los chats del usuario y los sincroniza con el store global.
 * Se llama una vez al login / inicialización de la app.
 */
export function useChats() {
  const setChats = useChatStore((s) => s.setChats);

  const query = useQuery({
    queryKey: CHATS_QUERY_KEY,
    queryFn: () => chatService.getAll(),
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchOnWindowFocus: false,
    enabled: !!authSDK.getCurrentUser(), // Solo cargar si hay usuario autenticado
  });

  // Sincronizar resultado con el store global
  useEffect(() => {
    if (query.data?.data) {
      setChats(query.data.data);
    }
  }, [query.data, setChats]);

  const chats = useMemo(() => query.data?.data ?? [], [query.data?.data]);

  return {
    chats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Selector de chats desde el store (sin refetch, solo lectura)
 * Usar en componentes que NO son el inicializador del chat.
 */
export function useChatList(): Chat[] {
  return useChatStore((s) => s.chats);
}
