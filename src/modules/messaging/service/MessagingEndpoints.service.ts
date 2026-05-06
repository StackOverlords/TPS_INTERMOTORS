export const MESSAGING_ENDPOINTS = {
  // Chats
  chats: {
    all: '/messaging/chats',
    byId: (id: number) => `/messaging/chats/${id}`,
    direct: '/messaging/chats/direct',
    group: '/messaging/chats/group',
    read: (id: number) => `/messaging/chats/${id}/read`,
  },

  // Messages
  messages: {
    all: (chatId: number) => `/messaging/chats/${chatId}/messages`,
    send: (chatId: number) => `/messaging/chats/${chatId}/messages`,
    poll: '/messaging/poll',
  },

  // Participants
  participants: {
    all: (chatId: number) => `/messaging/chats/${chatId}/participants`,
    add: (chatId: number) => `/messaging/chats/${chatId}/participants`,
    remove: (chatId: number, userId: number) =>
      `/messaging/chats/${chatId}/participants/${userId}`,
    leave: (chatId: number) => `/messaging/chats/${chatId}/leave`,
  },
} as const;