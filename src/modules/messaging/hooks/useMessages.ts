import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Message, OptimisticMessage } from "../types/Message.types";
import { useChatStore } from "../stores/ChatStore";
import { messageService } from "../service/Message.service";

// Array vacío estable — misma referencia siempre.
// NUNCA usar `?? []` inline: crea un array nuevo en cada render
// y Zustand lo detecta como snapshot diferente → infinite loop.
const EMPTY_MESSAGES: (Message | OptimisticMessage)[] = [];

const PAGE_SIZE = 30;

export const messagesQueryKey = (chatId: number) =>
  ["messaging", "messages", chatId] as const;

/**
 * Carga mensajes con paginación infinita (scroll hacia arriba = más antiguos).
 *
 * Usa mergeMessages en lugar de setMessages para sincronizar con el store.
 * Esto garantiza que los mensajes recibidos por WebSocket o los mensajes
 * optimistas NO se pierdan cuando el componente se desmonta y vuelve a montar
 * (ej: el usuario va a la lista de chats y vuelve al chat).
 *
 * Flujo:
 *   1. Query trae página 1 de la API → mergeMessages agrega solo los no existentes
 *   2. WebSocket agrega mensajes nuevos → appendMessage los pone al final del store
 *   3. Usuario vuelve al chat → query usa caché → mergeMessages no sobreescribe nada
 *   4. Usuario hace scroll arriba → fetchNextPage → prependMessages agrega más antiguos
 */
export function useMessages(chatId: number) {
  const mergeMessages = useChatStore((s) => s.mergeMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);

  const query = useInfiniteQuery({
    queryKey: messagesQueryKey(chatId),
    queryFn: ({ pageParam = 1 }) =>
      messageService.getAll(chatId, {
        pagina: pageParam as number,
        pagina_registros: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { current_page, last_page } = lastPage.meta;
      return current_page < last_page ? current_page + 1 : undefined;
    },
    // Sin staleTime alto para que la primera visita al chat sea siempre fresca.
    // mergeMessages garantiza que al remontar no se pierde nada del store.
    enabled: chatId > 0,
    // staleTime: 0,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchOnWindowFocus: false,
  });

  // Primera carga o refresco de la API → merge sin sobreescribir el store.
  // Se dispara cuando cambia chatId O cuando la query trae datos nuevos.
  // A diferencia de setMessages, mergeMessages preserva mensajes de WebSocket
  // y optimistas que ya estaban en el store.
  useEffect(() => {
    if (query.data?.pages[0]) {
      const firstPage = query.data.pages[0].data;
      mergeMessages(chatId, [...firstPage].reverse()); // más antiguos primero
    }
  }, [query.dataUpdatedAt, chatId, mergeMessages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Paginación hacia atrás: el usuario hizo scroll hasta arriba.
  // prependMessages ya deduplica por id, así que es seguro llamarlo siempre.
  useEffect(() => {
    if (query.data && query.data.pages.length > 1) {
      const lastLoadedPage = query.data.pages[query.data.pages.length - 1];
      prependMessages(chatId, [...lastLoadedPage.data].reverse());
    }
  }, [query.data?.pages.length, chatId, prependMessages]);

  return {
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    totalMessages: query.data?.pages[0]?.meta.total ?? 0,
  };
}

/**
 * Lee los mensajes del store para un chat específico.
 * Selector inline para evitar crear una nueva función en cada render
 * (lo cual causaría el error "getSnapshot should be cached" de Zustand).
 */
export function useChatMessages(
  chatId: number,
): (Message | OptimisticMessage)[] {
  return useChatStore((s) => s.messagesByChatId[chatId] ?? EMPTY_MESSAGES);
}
