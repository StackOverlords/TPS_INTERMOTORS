import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CHATS_QUERY_KEY } from "./useChats";
import { participantService } from "../service/Participant.service";
import type { AddParticipantPayload } from "../types/Participant.types";

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
// LEAVE
// ─────────────────────────────────────────────────────────────────────────────

export function useLeaveChat(chatId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => participantService.leave(chatId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CHATS_QUERY_KEY });
    },
  });
}
