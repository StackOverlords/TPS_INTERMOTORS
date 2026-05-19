import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import type {
  AddParticipantPayload,
  Participant,
  ParticipantsResponse,
} from "../types/Participant.types";
import { MESSAGING_ENDPOINTS } from "./MessagingEndpoints.service";
import { participantsResponseSchema } from "../schemas/Participant.schema";

const MODULE_NAME = "PARTICIPANT_SERVICE";

export const participantService = {
  /**
   * Obtener participantes de un chat
   */
  async getAll(chatId: number): Promise<ParticipantsResponse> {
    Logger.info("Fetching participants", { chatId }, MODULE_NAME);

    const response = await ApiService.get(
      MESSAGING_ENDPOINTS.participants.all(chatId),
      participantsResponseSchema,
    );

    Logger.info(
      "Participants fetched",
      { chatId, count: response.data.length },
      MODULE_NAME,
    );
    return response as ParticipantsResponse;
  },

  /**
   * Agregar participante a un grupo (requiere OWNER o ADMIN)
   */
  async add(
    chatId: number,
    payload: AddParticipantPayload,
  ): Promise<Participant> {
    Logger.info("Adding participant", { chatId, payload }, MODULE_NAME);

    const response = await ApiService.post(
      MESSAGING_ENDPOINTS.participants.add(chatId),
      payload,
    );

    Logger.info("Participant added", { chatId }, MODULE_NAME);
    return response as Participant;
  },

  /**
   * Remover participante (requiere OWNER/ADMIN)
   */
  async remove(chatId: number, userId: number): Promise<void> {
    Logger.info("Removing participant", { chatId, userId }, MODULE_NAME);
    await ApiService.delete(
      MESSAGING_ENDPOINTS.participants.remove(chatId, userId),
    );
    Logger.info("Participant removed", { chatId, userId }, MODULE_NAME);
  },

  /**
   * Salir del grupo (el propio usuario)
   */
  async leave(chatId: number): Promise<void> {
    Logger.info("Leaving chat", { chatId }, MODULE_NAME);
    await ApiService.delete(MESSAGING_ENDPOINTS.participants.leave(chatId));
    Logger.info("Left chat successfully", { chatId }, MODULE_NAME);
  },
};
