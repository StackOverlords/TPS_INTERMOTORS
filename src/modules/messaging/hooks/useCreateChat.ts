import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CHATS_QUERY_KEY } from "./useChats";
import { useChatStore } from "../stores/ChatStore";
import type {
  Chat,
  CreateDirectChatPayload,
  CreateGroupPayload,
} from "../types/Chat.types";
import { chatService } from "../service/Chat.service";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE DIRECT CHAT (DM)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea o recupera un chat directo con otro usuario.
 * Si ya existe, retorna el existente sin crear duplicado.
 * Al resolver, upserta en el store y retorna el chat para navegar.
 */
export function useCreateDirectChat() {
  const upsertChat = useChatStore((s) => s.upsertChat);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const queryClient = useQueryClient();

  return useMutation<Chat, Error, CreateDirectChatPayload>({
    mutationFn: (payload) => chatService.createDirect(payload),
    onSuccess: (chat) => {
      upsertChat(chat);
      setActiveChatId(chat.id);
      void queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE GROUP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea un grupo nuevo.
 * El creador queda como OWNER, los demás como MEMBER.
 * Al resolver, upserta en el store. El WebSocket se suscribirá
 * automáticamente via useMessagingWebSocket al detectar el nuevo chat.
 */
export function useCreateGroup() {
  const upsertChat = useChatStore((s) => s.upsertChat);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const queryClient = useQueryClient();

  return useMutation<Chat, Error, CreateGroupPayload>({
    mutationFn: (payload) => chatService.createGroup(payload),
    onSuccess: (chat) => {
      upsertChat(chat);
      setActiveChatId(chat.id);
      void queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
    },
  });
}
