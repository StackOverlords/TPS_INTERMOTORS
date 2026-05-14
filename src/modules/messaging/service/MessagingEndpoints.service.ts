export const MESSAGING_ENDPOINTS = {
  // ── Usuarios disponibles para chatear ──────────────────────────────────────
  // Endpoint propio del módulo — distinto al /users general
  users: {
    all: "/messaging/users",
  },

  // ── Chats ──────────────────────────────────────────────────────────────────
  chats: {
    all: "/messaging/chats",
    byId: (id: number) => `/messaging/chats/${id}`,
    direct: "/messaging/chats/direct",
    group: "/messaging/chats/group",
    read: (id: number) => `/messaging/chats/${id}/read`,
    /** PATCH — editar nombre/descripción de un grupo (OWNER/ADMIN) */
    update: (id: number) => `/messaging/chats/${id}`,
  },

  // ── Messages ───────────────────────────────────────────────────────────────
  messages: {
    all: (chatId: number) => `/messaging/chats/${chatId}/messages`,
    send: (chatId: number) => `/messaging/chats/${chatId}/messages`,
    poll: "/messaging/poll",
    /** PATCH — editar contenido (solo remitente, solo TEXT, solo 24h) */
    edit: (chatId: number, messageId: number) =>
      `/messaging/chats/${chatId}/messages/${messageId}`,
    /**
     * DELETE — eliminar mensaje.
     * ?para_todos=1 → elimina para todos (broadcast .message.deleted)
     * sin param    → elimina solo para mí (sin broadcast)
     */
    delete: (chatId: number, messageId: number) =>
      `/messaging/chats/${chatId}/messages/${messageId}`,
  },

  // ── Attachments ────────────────────────────────────────────────────────────
  attachments: {
    upload: (chatId: number) => `/messaging/chats/${chatId}/attachments`,
  },

  // ── Participants ───────────────────────────────────────────────────────────
  participants: {
    all: (chatId: number) => `/messaging/chats/${chatId}/participants`,
    add: (chatId: number) => `/messaging/chats/${chatId}/participants`,
    remove: (chatId: number, userId: number) =>
      `/messaging/chats/${chatId}/participants/${userId}`,
    leave: (chatId: number) => `/messaging/chats/${chatId}/leave`,
  },

  presence: {
    leave: "/messaging/presence/leave",
  },
} as const;
