import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Message, OptimisticMessage } from "../types/Message.types";
import type { Chat } from "../types/Chat.types";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construye el preview de último mensaje para la lista de chats
 * a partir de un Message real (no optimista).
 */
function buildUltimoMensaje(message: Message): Chat["ultimo_mensaje"] {
  return {
    id: message.id,
    contenido: message.contenido,
    remitente: message.remitente,
    fecha_reg: message.fecha_reg,
    referencia_tipo: message.referencia_tipo,
    referencia_id: message.referencia_id,
    es_sistema: message.es_sistema,
    editado: message.editado,
    fecha_editado: message.fecha_editado,
  };
}

/**
 * Re-ordena el array de chats poniendo primero el que tiene
 * el último mensaje más reciente.
 * Opera sobre el draft de Immer (mutación directa).
 */
function sortChatsByLastMessage(chats: Chat[]): void {
  chats.sort((a, b) => {
    const at = a.ultimo_mensaje?.fecha_reg ?? a.fecha_reg;
    const bt = b.ultimo_mensaje?.fecha_reg ?? b.fecha_reg;
    return new Date(bt).getTime() - new Date(at).getTime();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE SHAPE
// ─────────────────────────────────────────────────────────────────────────────

interface ChatState {
  // Lista de chats cargados al login
  chats: Chat[];
  chatsLoaded: boolean;

  // Chat activo (panel de mensajes abierto)
  activeChatId: number | null;

  /**
   * Chat directo pendiente de creación (lazy creation).
   * Se establece al seleccionar un usuario en direct mode.
   * El chat se crea en el backend SOLO cuando se envía el primer mensaje.
   * Si el usuario sale sin enviar, se limpia sin llamar al backend.
   */
  pendingDirectChat: { userId: number; nombre: string } | null;

  // Mensajes en memoria por chatId (cargados al abrir el chat)
  messagesByChatId: Record<number, (Message | OptimisticMessage)[]>;

  // Timestamp del último mensaje recibido por chatId (para polling)
  lastMessageTimestampByChatId: Record<number, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

interface ChatActions {
  // Chats
  setChats: (chats: Chat[]) => void;
  setActiveChatId: (id: number | null) => void;
  upsertChat: (chat: Chat) => void;
  setPendingDirectChat: (
    pending: { userId: number; nombre: string } | null,
  ) => void;

  // Mensajes
  setMessages: (
    chatId: number,
    messages: (Message | OptimisticMessage)[],
  ) => void;
  /**
   * Combina mensajes de la API con los del store sin sobreescribir.
   * Deduplica por id. Los mensajes optimistas y los recibidos por WebSocket
   * se preservan aunque el query vuelva a dispararse por navegación.
   * Usar en lugar de setMessages para la carga inicial/paginada desde TanStack Query.
   */
  mergeMessages: (chatId: number, incomingFromApi: Message[]) => void;
  prependMessages: (chatId: number, messages: Message[]) => void; // para paginación hacia atrás
  appendMessage: (chatId: number, message: Message | OptimisticMessage) => void;
  replaceOptimisticMessage: (
    chatId: number,
    tempId: string,
    message: Message,
  ) => void;
  markOptimisticAsFailed: (chatId: number, tempId: string) => void;
  updateOptimisticProgress: (
    chatId: number,
    tempId: string,
    progress: number,
  ) => void;

  // Unread badges
  incrementUnread: (chatId: number) => void;
  resetUnread: (chatId: number) => void;

  // Polling timestamps
  setLastMessageTimestamp: (chatId: number, timestamp: string) => void;

  // Reset
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const initialState: ChatState = {
  chats: [],
  chatsLoaded: false,
  activeChatId: null,
  pendingDirectChat: null,
  messagesByChatId: {},
  lastMessageTimestampByChatId: {},
};

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState & ChatActions>()(
  immer((set) => ({
    ...initialState,

    // ── Chats ──────────────────────────────────────────────────────────────

    setChats: (chats) =>
      set((state) => {
        state.chats = chats;
        state.chatsLoaded = true;
        // Inicializar timestamps desde el último mensaje de cada chat
        chats.forEach((chat) => {
          if (chat.ultimo_mensaje) {
            state.lastMessageTimestampByChatId[chat.id] =
              chat.ultimo_mensaje.fecha_reg;
          }
        });
      }),

    setActiveChatId: (id) =>
      set((state) => {
        state.activeChatId = id;
        // Al activar un chat real, limpiar cualquier pending
        if (id !== null) state.pendingDirectChat = null;
      }),

    setPendingDirectChat: (pending) =>
      set((state) => {
        state.pendingDirectChat = pending;
        // Al poner un pending, limpiar el chat activo real
        if (pending !== null) state.activeChatId = null;
      }),

    upsertChat: (chat) =>
      set((state) => {
        const idx = state.chats.findIndex((c) => c.id === chat.id);
        if (idx >= 0) {
          state.chats[idx] = chat;
        } else {
          state.chats.unshift(chat);
        }
        sortChatsByLastMessage(state.chats);
      }),

    // ── Messages ───────────────────────────────────────────────────────────

    setMessages: (chatId, messages) =>
      set((state) => {
        state.messagesByChatId[chatId] = messages;
        if (messages.length > 0) {
          const last = messages[messages.length - 1];
          state.lastMessageTimestampByChatId[chatId] = last.fecha_reg;
        }
      }),

    mergeMessages: (chatId, incomingFromApi) =>
      set((state) => {
        const current = state.messagesByChatId[chatId] ?? [];

        // IDs reales que ya están en el store (incluye mensajes de WebSocket
        // recibidos después de la carga inicial).
        const existingRealIds = new Set(
          current.filter((m) => !("_tempId" in m)).map((m) => m.id),
        );

        // Solo agregar los mensajes de la API que aún no están en el store
        const newFromApi = incomingFromApi.filter(
          (m) => !existingRealIds.has(m.id),
        );

        if (newFromApi.length === 0) {
          // No hay nada nuevo desde la API — el store ya tiene todo
          return;
        }

        // Combinar y reordenar cronológicamente
        // (los mensajes de la API son más antiguos que los del WebSocket)
        const merged = [...newFromApi, ...current].sort(
          (a, b) =>
            new Date(a.fecha_reg).getTime() - new Date(b.fecha_reg).getTime(),
        );

        state.messagesByChatId[chatId] = merged;

        // Actualizar timestamp con el mensaje más reciente
        const last = merged[merged.length - 1];
        if (last) {
          state.lastMessageTimestampByChatId[chatId] = last.fecha_reg;
        }
      }),

    prependMessages: (chatId, messages) =>
      set((state) => {
        const current = state.messagesByChatId[chatId] ?? [];
        // Deduplicar por id
        const existingIds = new Set(current.map((m) => m.id));
        const newUnique = messages.filter((m) => !existingIds.has(m.id));
        state.messagesByChatId[chatId] = [...newUnique, ...current];
      }),

    appendMessage: (chatId, message) =>
      set((state) => {
        if (!state.messagesByChatId[chatId]) {
          state.messagesByChatId[chatId] = [];
        }

        // Evitar duplicados (mismo id real)
        const exists = state.messagesByChatId[chatId].some(
          (m) => !("_tempId" in m) && m.id === message.id,
        );

        if (!exists) {
          state.messagesByChatId[chatId].push(message);

          // Solo actualizar metadatos con mensajes reales confirmados por el servidor
          if (!("_tempId" in message)) {
            state.lastMessageTimestampByChatId[chatId] = message.fecha_reg;

            // Actualizar el preview en la lista de chats.
            // Sin esto, la lista no refleja el último mensaje ni la hora.
            const chatIdx = state.chats.findIndex((c) => c.id === chatId);
            if (chatIdx >= 0) {
              state.chats[chatIdx].ultimo_mensaje = buildUltimoMensaje(message);
              // Re-ordenar para que este chat suba al tope de la lista
              sortChatsByLastMessage(state.chats);
            }
          }
        }
      }),

    replaceOptimisticMessage: (chatId, tempId, message) =>
      set((state) => {
        const msgs = state.messagesByChatId[chatId];
        if (!msgs) return;

        const idx = msgs.findIndex(
          (m) => "_tempId" in m && (m as OptimisticMessage)._tempId === tempId,
        );

        if (idx >= 0) {
          msgs[idx] = message;
          state.lastMessageTimestampByChatId[chatId] = message.fecha_reg;

          // También actualizar el preview al confirmar el mensaje propio
          const chatIdx = state.chats.findIndex((c) => c.id === chatId);
          if (chatIdx >= 0) {
            state.chats[chatIdx].ultimo_mensaje = buildUltimoMensaje(message);
            sortChatsByLastMessage(state.chats);
          }
        }
      }),

    markOptimisticAsFailed: (chatId, tempId) =>
      set((state) => {
        const msgs = state.messagesByChatId[chatId];
        if (!msgs) return;
        const msg = msgs.find(
          (m) => "_tempId" in m && (m as OptimisticMessage)._tempId === tempId,
        ) as OptimisticMessage | undefined;
        if (msg) {
          msg._status = "failed";
        }
      }),

    updateOptimisticProgress: (chatId, tempId, progress) =>
      set((state) => {
        const msgs = state.messagesByChatId[chatId];
        if (!msgs) return;
        const msg = msgs.find(
          (m) => "_tempId" in m && (m as OptimisticMessage)._tempId === tempId,
        ) as OptimisticMessage | undefined;
        if (msg) {
          msg._progress = progress;
          msg._status = "uploading";
        }
      }),

    // ── Unread ─────────────────────────────────────────────────────────────

    incrementUnread: (chatId) =>
      set((state) => {
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) {
          chat.no_leidos += 1;
        }
      }),

    resetUnread: (chatId) =>
      set((state) => {
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) {
          chat.no_leidos = 0;
        }
      }),

    // ── Polling ────────────────────────────────────────────────────────────

    setLastMessageTimestamp: (chatId, timestamp) =>
      set((state) => {
        state.lastMessageTimestampByChatId[chatId] = timestamp;
      }),

    // ── Reset ──────────────────────────────────────────────────────────────

    reset: () => set(() => initialState),
  })),
);

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS (memoized)
// ─────────────────────────────────────────────────────────────────────────────

export const selectActiveChat = (state: ChatState) =>
  state.activeChatId
    ? (state.chats.find((c) => c.id === state.activeChatId) ?? null)
    : null;

export const selectTotalUnread = (state: ChatState) =>
  state.chats.reduce((sum, c) => sum + c.no_leidos, 0);

export const selectChatMessages = (chatId: number) => (state: ChatState) =>
  state.messagesByChatId[chatId] ?? [];

export function messageExists(chatId: number, messageId: number): boolean {
  const msgs = useChatStore.getState().messagesByChatId[chatId] ?? [];
  return msgs.some((m) => !("_tempId" in m) && m.id === messageId);
}
