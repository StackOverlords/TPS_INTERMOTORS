import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import type {
  Message,
  MessagesGetAllResponse,
  PollResponse,
  SendMessagePayload,
} from "../types/Message.types";
import { MESSAGING_ENDPOINTS } from "./MessagingEndpoints.service";
import {
  messageSchema,
  messagesGetAllResponseSchema,
  pollResponseSchema,
} from "../schemas/Message.schema";

const MODULE_NAME = "MESSAGE_SERVICE";

export interface GetMessagesParams {
  pagina?: number;
  pagina_registros?: number;
}

export const messageService = {
  /**
   * Obtener mensajes de un chat (paginado)
   */
  async getAll(
    chatId: number,
    params: GetMessagesParams = {},
  ): Promise<MessagesGetAllResponse> {
    Logger.info("Fetching messages", { chatId, params }, MODULE_NAME);

    const response = await ApiService.get(
      MESSAGING_ENDPOINTS.messages.all(chatId),
      messagesGetAllResponseSchema,
      { params: { pagina: 1, pagina_registros: 30, ...params } },
    );

    Logger.info(
      "Messages fetched",
      { chatId, count: response.data.length },
      MODULE_NAME,
    );
    return response as MessagesGetAllResponse;
  },

  /**
   * Enviar un mensaje
   */
  async send(chatId: number, payload: SendMessagePayload): Promise<Message> {
    Logger.info("Sending message", { chatId }, MODULE_NAME);

    const response = await ApiService.post(
      MESSAGING_ENDPOINTS.messages.send(chatId),
      payload,
      messageSchema,
      undefined,
      { unwrapData: true },
    );

    Logger.info(
      "Message sent successfully",
      { chatId, id: (response as Message).id },
      MODULE_NAME,
    );
    return response as Message;
  },

  /**
   * Polling fallback cuando Reverb no está disponible
   */
  async poll(chatId: number, since: string): Promise<PollResponse> {
    Logger.info("Polling for new messages", { chatId, since }, MODULE_NAME);

    const response = await ApiService.get(
      MESSAGING_ENDPOINTS.messages.poll,
      pollResponseSchema,
      { params: { chat_id: chatId, since } },
    );

    Logger.info(
      "Poll complete",
      { chatId, newMessages: response.data.length },
      MODULE_NAME,
    );
    return response as PollResponse;
  },
};
