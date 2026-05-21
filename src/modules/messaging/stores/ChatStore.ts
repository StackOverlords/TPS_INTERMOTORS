import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Message, OptimisticMessage } from "../types/Message.types";
import type { Chat } from "../types/Chat.types";
import { chatService } from "../service/Chat.service";
import { messageService } from "../service/Message.service";
import { useChatUIStore } from "./ChatUiStore";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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
  chats: Chat[];
  chatsLoaded: boolean;
  activeChatId: number | null;

  /**
   * Chat directo pendiente de creación (lazy creation).
   * Se establece al seleccionar un usuario en direct mode.
   * El chat se crea en el backend SOLO cuando se envía el primer mensaje.
   * Si el usuario sale sin enviar, se limpia sin llamar al backend.
   */
  pendingDirectChat: { userId: number; nombre: string } | null;
  messagesByChatId: Record<number, (Message | OptimisticMessage)[]>;
  lastMessageTimestampByChatId: Record<number, string>;
  /**
   * Registro local de chats eliminados "para mí".
   * ConversationList filtra estos chats de la lista a menos que haya
   * un mensaje posterior a deleted_at.
   */
  chatDeletions: Record<number, string>;
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
  updateChatInfo: (
    chatId: number,
    updates: { nombre?: string; descripcion?: string | null },
  ) => void;

  /**
   * Elimina un participante de chat.participantes en el store.
   * Se usa al recibir participant.removed en el canal del chat
   * (para actualizar la lista de participantes visible).
   */
  removeParticipantFromChat: (chatId: number, userId: number) => void;

  /**
   * Marca el chat como ex-miembro actualizando mi_participacion.fecha_salida.
   * El chat sigue visible en la lista como read-only.
   * Se usa al recibir participant.removed para MÍ MISMO.
   */
  markChatAsExMember: (chatId: number, fechaSalida: string) => void;

  /**
   * Reactiva la membresía tras ser re-agregado al grupo.
   * Limpia fecha_salida sin tocar los mensajes cacheados — el usuario
   * conserva los mensajes anteriores a su salida y los nuevos
   * llegan por WebSocket tras la re-suscripción al canal.
   */
  clearExMemberStatus: (chatId: number) => void;

  /**
   * Elimina el chat completo del store.
   * Solo para group_deleted (el grupo fue eliminado para todos).
   */
  removeChat: (chatId: number) => void;

  /**
   * Registra que el usuario eliminó el chat "para sí mismo".
   * El chat permanece en store pero ConversationList lo oculta.
   * También limpia el caché de mensajes para forzar fetch fresco.
   */
  setChatDeletion: (chatId: number, deletedAt: string) => void;

  /**
   * Elimina el registro de deletion para un chat.
   * Se usa cuando el usuario es re-agregado al grupo.
   */
  clearChatDeletion: (chatId: number) => void;

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
  prependMessages: (chatId: number, messages: Message[]) => void;
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
  editMessage: (
    chatId: number,
    messageId: number,
    updates: { contenido: string; editado: boolean; fecha_editado: string },
  ) => void;
  /**
   * Elimina (o marca como eliminado) un mensaje del store.
   * mode 'remove' → lo saca del array (para_todos).
   * mode 'hide'   → lo marca con eliminado:true sin sacarlo del array (para_mi).
   */
  deleteMessage: (
    chatId: number,
    messageId: number,
    mode?: "remove" | "hide",
  ) => void;

  // Unread badges
  incrementUnread: (chatId: number) => void;
  resetUnread: (chatId: number) => void;

  // Polling timestamps
  setLastMessageTimestamp: (chatId: number, timestamp: string) => void;

  // Reset
  reset: () => void;

  // ── Transfer Requests ─────────────────────────────────────────────────────

  /**
   * Crea o reutiliza un DM con `toUserId`, luego envía un mensaje
   * de tipo transfer_request con la referencia al pedido.
   * Abre el panel de chat apuntando al chat correcto.
   */
  sendTransferRequest: (params: {
    toUserId: number;
    transferRequestId: number;
    itemCount: number;
  }) => Promise<void>;
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
  chatDeletions: {},
};

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState & ChatActions>()(
  immer((set, get) => ({
    ...initialState,

    // ── Chats ──────────────────────────────────────────────────────────────

    setChats: (chats) =>
      set((state) => {
        const activeId = state.activeChatId;
        state.chats = chats.map((chat) => ({
          ...chat,
          no_leidos: chat.id === activeId ? 0 : chat.no_leidos,
        }));
        state.chatsLoaded = true;
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
        if (id !== null) state.pendingDirectChat = null;
        // Persistir último chat abierto para restauración tras recarga
        try {
          if (id !== null) {
            localStorage.setItem("messaging_last_chat_id", String(id));
          } else {
            // Volvió a la lista → borrar para no restaurar
            localStorage.removeItem("messaging_last_chat_id");
          }
        } catch {
          // localStorage no disponible
        }
      }),

    setPendingDirectChat: (pending) =>
      set((state) => {
        state.pendingDirectChat = pending;
        if (pending !== null) state.activeChatId = null;
      }),

    upsertChat: (chat) =>
      set((state) => {
        const isActive = chat.id === state.activeChatId;
        const merged = isActive ? { ...chat, no_leidos: 0 } : chat;
        const idx = state.chats.findIndex((c) => c.id === chat.id);
        if (idx >= 0) {
          state.chats[idx] = merged;
        } else {
          state.chats.unshift(merged);
        }
        sortChatsByLastMessage(state.chats);

        // Si el chat llegó con fecha_salida=null, el usuario fue re-agregado
        // → limpiar deletion local (el backend ya limpió el registro en DB)
        if (chat.mi_participacion.fecha_salida === null) {
          delete state.chatDeletions[chat.id];
        }
      }),

    updateChatInfo: (chatId, updates) =>
      set((state) => {
        const idx = state.chats.findIndex((c) => c.id === chatId);
        if (idx >= 0) {
          if (updates.nombre !== undefined)
            state.chats[idx].nombre = updates.nombre;
          if (updates.descripcion !== undefined)
            state.chats[idx].descripcion = updates.descripcion;
        }
      }),

    // quitar un participante de la lista del chat ─────────────────
    removeParticipantFromChat: (chatId, userId) =>
      set((state) => {
        const chat = state.chats.find((c) => c.id === chatId);
        if (!chat) return;
        chat.participantes = chat.participantes.filter(
          (p) => p.usuario?.id !== userId,
        );
      }),

    // ── Ex-miembro: mantener chat pero marcarlo read-only ──────────────────
    markChatAsExMember: (chatId, fechaSalida) =>
      set((state) => {
        const chat = state.chats.find((c) => c.id === chatId);
        if (!chat) return;
        chat.mi_participacion.fecha_salida = fechaSalida;
        // Ex-miembro no tiene mensajes no leídos pendientes
        chat.no_leidos = 0;
      }),

    // ── Reactivar membresía tras ser re-agregado ───────────────────────────
    clearExMemberStatus: (chatId) =>
      set((state) => {
        const chat = state.chats.find((c) => c.id === chatId);
        if (!chat) return;
        chat.mi_participacion.fecha_salida = null;
        delete state.chatDeletions[chatId];
      }),

    // ── Eliminar chat completo (group_deleted para todos) ─────────────────
    removeChat: (chatId) =>
      set((state) => {
        state.chats = state.chats.filter((c) => c.id !== chatId);

        if (state.activeChatId === chatId) {
          state.activeChatId = null;
        }

        delete state.messagesByChatId[chatId];
        delete state.lastMessageTimestampByChatId[chatId];
        delete state.chatDeletions[chatId];

        try {
          const stored = localStorage.getItem("messaging_last_chat_id");
          if (stored === String(chatId)) {
            localStorage.removeItem("messaging_last_chat_id");
          }
        } catch {
          // no-op
        }
      }),

    // ── Eliminar chat "para mí" ────────────────────────────────────────────
    setChatDeletion: (chatId, deletedAt) =>
      set((state) => {
        state.chatDeletions[chatId] = deletedAt;

        // Limpiar mensajes cacheados: cuando el chat reaparezca (nuevo mensaje)
        // se hará un fetch fresco desde deleted_at en adelante.
        delete state.messagesByChatId[chatId];
        delete state.lastMessageTimestampByChatId[chatId];

        // Si era el chat activo, volver a la lista
        if (state.activeChatId === chatId) {
          state.activeChatId = null;
        }
      }),

    clearChatDeletion: (chatId) =>
      set((state) => {
        delete state.chatDeletions[chatId];
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
        const existingRealIds = new Set(
          current.filter((m) => !("_tempId" in m)).map((m) => m.id),
        );
        const newFromApi = incomingFromApi.filter(
          (m) => !existingRealIds.has(m.id),
        );
        if (newFromApi.length === 0) return;

        const merged = [...newFromApi, ...current].sort(
          (a, b) =>
            new Date(a.fecha_reg).getTime() - new Date(b.fecha_reg).getTime(),
        );
        state.messagesByChatId[chatId] = merged;

        const last = merged[merged.length - 1];
        if (last) state.lastMessageTimestampByChatId[chatId] = last.fecha_reg;
      }),

    prependMessages: (chatId, messages) =>
      set((state) => {
        const current = state.messagesByChatId[chatId] ?? [];
        const existingIds = new Set(current.map((m) => m.id));
        const newUnique = messages.filter((m) => !existingIds.has(m.id));
        state.messagesByChatId[chatId] = [...newUnique, ...current];
      }),

    appendMessage: (chatId, message) =>
      set((state) => {
        if (!state.messagesByChatId[chatId]) {
          state.messagesByChatId[chatId] = [];
        }
        const exists = state.messagesByChatId[chatId].some(
          (m) => !("_tempId" in m) && m.id === message.id,
        );

        if (!exists) {
          state.messagesByChatId[chatId].push(message);
          if (!("_tempId" in message)) {
            state.lastMessageTimestampByChatId[chatId] = message.fecha_reg;
            const chatIdx = state.chats.findIndex((c) => c.id === chatId);
            if (chatIdx >= 0) {
              state.chats[chatIdx].ultimo_mensaje = buildUltimoMensaje(message);
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
        if (msg) msg._status = "failed";
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

    editMessage: (chatId, messageId, updates) =>
      set((state) => {
        const msgs = state.messagesByChatId[chatId];
        if (!msgs) return;
        const idx = msgs.findIndex(
          (m) => !("_tempId" in m) && m.id === messageId,
        );
        if (idx >= 0) {
          const msg = msgs[idx] as Message;
          msg.contenido = updates.contenido;
          msg.editado = updates.editado;
          msg.fecha_editado = updates.fecha_editado;
        }
      }),

    deleteMessage: (chatId, messageId, mode = "remove") =>
      set((state) => {
        const msgs = state.messagesByChatId[chatId];
        if (!msgs) return;
        if (mode === "remove") {
          // Eliminar del array (para_todos): conservar optimistas, filtrar por id real
          state.messagesByChatId[chatId] = msgs.filter((m) => {
            if ("_tempId" in m) return true;
            return m.id !== messageId;
          });
        } else {
          // Ocultar localmente (para_mi) — marcar sin sacar del array
          const idx = msgs.findIndex(
            (m) => !("_tempId" in m) && m.id === messageId,
          );
          if (idx >= 0) (msgs[idx] as Message).eliminado = true;
        }
      }),

    // ── Unread ─────────────────────────────────────────────────────────────

    incrementUnread: (chatId) =>
      set((state) => {
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) chat.no_leidos += 1;
      }),

    resetUnread: (chatId) =>
      set((state) => {
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) chat.no_leidos = 0;
      }),

    // ── Polling ────────────────────────────────────────────────────────────

    setLastMessageTimestamp: (chatId, timestamp) =>
      set((state) => {
        state.lastMessageTimestampByChatId[chatId] = timestamp;
      }),

    // ── Transfer Requests ──────────────────────────────────────────────────

    sendTransferRequest: async ({ toUserId, transferRequestId, itemCount }) => {
      // 1. Check if a DIRECT chat with toUserId already exists in the store.
      const { chats } = get();
      let chat = chats.find(
        (c) =>
          c.tipo === "DIRECT" &&
          c.participantes.some((p) => p.usuario?.id === toUserId),
      ) ?? null;

      // 2. If no DM exists, create/retrieve it via the backend.
      if (!chat) {
        chat = await chatService.createDirect({ usuario_id: toUserId });
        // Upsert into the store so subsequent operations can find it.
        useChatStore.getState().upsertChat(chat);
      }

      // 3. Send the transfer request message.
      const plural = itemCount !== 1 ? "s" : "";
      await messageService.send(chat.id, {
        contenido: `Solicitud de transferencia — ${itemCount} producto${plural}`,
        referencia_tipo: "transfer_request",
        referencia_id: transferRequestId,
      });

      // 4. Open the chat panel and navigate to the chat.
      set((state) => {
        state.activeChatId = chat!.id;
        state.pendingDirectChat = null;
        try {
          localStorage.setItem("messaging_last_chat_id", String(chat!.id));
        } catch {
          // localStorage not available
        }
      });
      useChatUIStore.getState().open();
    },

    // ── Reset ──────────────────────────────────────────────────────────────

    reset: () =>
      set(() => {
        try {
          localStorage.removeItem("messaging_last_chat_id");
        } catch {
          // no-op
        }
        return initialState;
      }),
  })),
);

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
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
