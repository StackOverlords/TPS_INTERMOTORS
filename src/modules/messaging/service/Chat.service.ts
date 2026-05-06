import { ApiService } from '@/lib/apiService';
import { Logger } from '@/lib/logger';
import type { Chat, ChatsGetAllResponse, CreateDirectChatPayload, CreateGroupPayload } from '../types/Chat.types';
import { MESSAGING_ENDPOINTS } from './MessagingEndpoints.service';
import { chatSchema, chatsGetAllResponseSchema } from '../schemas/Chat.schema';

const MODULE_NAME = 'CHAT_SERVICE';

export const chatService = {
  /**
   * Obtener todos los chats del usuario autenticado
   */
  async getAll(): Promise<ChatsGetAllResponse> {
    Logger.info('Fetching all chats', undefined, MODULE_NAME);

    const response = await ApiService.get(
      MESSAGING_ENDPOINTS.chats.all,
      chatsGetAllResponseSchema,
    );

    Logger.info('Chats fetched successfully', { count: response.data.length }, MODULE_NAME);
    return response as ChatsGetAllResponse;
  },

  /**
   * Obtener un chat por ID
   */
  async getById(id: number): Promise<Chat> {
    Logger.info('Fetching chat by id', { id }, MODULE_NAME);

    const response = await ApiService.get(
      MESSAGING_ENDPOINTS.chats.byId(id),
      chatSchema,
      undefined,
      { unwrapData: true },
    );

    Logger.info('Chat fetched successfully', { id }, MODULE_NAME);
    return response as Chat;
  },

  /**
   * Crear o recuperar un chat directo (DM)
   */
  async createDirect(payload: CreateDirectChatPayload): Promise<Chat> {
    Logger.info('Creating direct chat', { payload }, MODULE_NAME);

    const response = await ApiService.post(
      MESSAGING_ENDPOINTS.chats.direct,
      payload,
      chatSchema,
      undefined,
      { unwrapData: true },
    );

    Logger.info('Direct chat created/retrieved', { id: (response as Chat).id }, MODULE_NAME);
    return response as Chat;
  },

  /**
   * Crear un grupo
   */
  async createGroup(payload: CreateGroupPayload): Promise<Chat> {
    Logger.info('Creating group chat', { payload }, MODULE_NAME);

    const response = await ApiService.post(
      MESSAGING_ENDPOINTS.chats.group,
      payload,
      chatSchema,
      undefined,
      { unwrapData: true },
    );

    Logger.info('Group chat created', { id: (response as Chat).id }, MODULE_NAME);
    return response as Chat;
  },

  /**
   * Marcar chat como leído (resetea no_leidos)
   */
  async markAsRead(chatId: number): Promise<void> {
    Logger.info('Marking chat as read', { chatId }, MODULE_NAME);
    await ApiService.patch(MESSAGING_ENDPOINTS.chats.read(chatId), {});
    Logger.info('Chat marked as read', { chatId }, MODULE_NAME);
  },
};