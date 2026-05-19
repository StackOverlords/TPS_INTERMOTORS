import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CHATS_QUERY_KEY } from "./useChats";
import { participantService } from "../service/Participant.service";
import type { AddParticipantPayload } from "../types/Participant.types";
import { chatService } from "../service/Chat.service";
import { useChatStore } from "../stores/ChatStore";

export const participantsQueryKey = (chatId: number) =>
  ["messaging", "participants", chatId] as const;

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

export function useParticipants(chatId: number) {
  return useQuery({
    queryKey: participantsQueryKey(chatId),
    queryFn: () => participantService.getAll(chatId),
    select: (data) => data.data,
    staleTime: 1000 * 60, // 1 minuto
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD
// ─────────────────────────────────────────────────────────────────────────────

export function useAddParticipant(chatId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddParticipantPayload) =>
      participantService.add(chatId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: participantsQueryKey(chatId) });
      void qc.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REMOVE
// ─────────────────────────────────────────────────────────────────────────────

export function useRemoveParticipant(chatId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => participantService.remove(chatId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: participantsQueryKey(chatId) });
      void qc.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE (salir del grupo)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * El usuario sale del grupo voluntariamente.
 * NO elimina el chat del store — el WebSocket event participant.removed
 * llamará a markChatAsExMember para marcarlo como read-only.
 * El backend devuelve el chat como ex-miembro en el próximo FetchChats.
 */
export function useLeaveChat(chatId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => participantService.leave(chatId),
    onSuccess: () => {
      // Invalidar para que FetchChats traiga el chat actualizado con fecha_salida
      void qc.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE CHAT FOR ME (eliminar para mí)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Elimina el chat "para mí".
 * El chat desaparece de la lista pero si llega un nuevo mensaje, reaparece.
 * Aplica a directos, grupos (siendo miembro o ex-miembro).
 */
export function useDeleteChatForMe(chatId: number) {
  const setChatDeletion = useChatStore((s) => s.setChatDeletion);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);

  return useMutation({
    mutationFn: () => chatService.deleteForMe(chatId),
    onSuccess: () => {
      // Actualizar store inmediatamente (optimistic)
      setChatDeletion(chatId, new Date().toISOString());
      setActiveChatId(null);
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE GROUP FOR ALL (eliminar grupo para todos — solo OWNER)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * El OWNER elimina el grupo para todos los participantes.
 * El WebSocket event chat.deleted se encargará de eliminar el chat
 * del store para todos los clientes conectados.
 * Para el OWNER local, removeChat() se llama optimísticamente.
 */
export function useDeleteGroup(chatId: number) {
  const removeChat = useChatStore((s) => s.removeChat);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);

  return useMutation({
    mutationFn: () => chatService.deleteGroup(chatId),
    onSuccess: () => {
      // El OWNER ya no necesita esperar el WS event — lo hace local
      setActiveChatId(null);
      removeChat(chatId);
    },
  });
}
