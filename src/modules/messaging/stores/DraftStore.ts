/**
 * Borradores de mensajes por chatId.
 * - Persiste en memoria + sessionStorage (sobrevive navegación pero no cierre)
 * - TTL de 4 horas: suficiente para interrupciones de trabajo,
 *   sin acumular basura indefinidamente
 * - En la lista de chats se muestra "Borrador: texto..." si existe
 */
import { create } from "zustand";

const DRAFT_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas
const STORAGE_KEY = "chat_drafts";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface DraftEntry {
  content: string;
  savedAt: number; // timestamp ms
}

interface DraftState {
  drafts: Record<number, DraftEntry>;
}

interface DraftActions {
  setDraft: (chatId: number, content: string) => void;
  getDraft: (chatId: number) => string | null;
  clearDraft: (chatId: number) => void;
  clearAllDrafts: () => void;
  /** Limpia borradores expirados — llamar al montar MessagingProvider */
  pruneExpired: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCE HELPERS (sessionStorage — sobrevive recarga, no cierre)
// ─────────────────────────────────────────────────────────────────────────────

function loadFromStorage(): Record<number, DraftEntry> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<number, DraftEntry>;
    // Filtrar expirados al cargar
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, entry]) => now - entry.savedAt < DRAFT_TTL_MS,
      ),
    );
  } catch {
    return {};
  }
}

function saveToStorage(drafts: Record<number, DraftEntry>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // sessionStorage lleno u otro error — ignorar silenciosamente
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useDraftStore = create<DraftState & DraftActions>()(
  (set, get) => ({
    drafts: loadFromStorage(),

    setDraft: (chatId, content) => {
      set((state) => {
        if (!content.trim()) {
          // Si el contenido está vacío, eliminar el borrador
          const { [chatId]: _, ...rest } = state.drafts;
          saveToStorage(rest);
          return { drafts: rest };
        }
        const updated = {
          ...state.drafts,
          [chatId]: { content, savedAt: Date.now() },
        };
        saveToStorage(updated);
        return { drafts: updated };
      });
    },

    getDraft: (chatId) => {
      const entry = get().drafts[chatId];
      if (!entry) return null;
      if (Date.now() - entry.savedAt >= DRAFT_TTL_MS) {
        // Expirado — limpiar y devolver null
        get().clearDraft(chatId);
        return null;
      }
      return entry.content;
    },

    clearDraft: (chatId) => {
      set((state) => {
        const { [chatId]: _, ...rest } = state.drafts;
        saveToStorage(rest);
        return { drafts: rest };
      });
    },

    clearAllDrafts: () => {
      sessionStorage.removeItem(STORAGE_KEY);
      set({ drafts: {} });
    },

    pruneExpired: () => {
      const now = Date.now();
      set((state) => {
        const pruned = Object.fromEntries(
          Object.entries(state.drafts).filter(
            ([, entry]) => now - entry.savedAt < DRAFT_TTL_MS,
          ),
        );
        if (Object.keys(pruned).length !== Object.keys(state.drafts).length) {
          saveToStorage(pruned);
          return { drafts: pruned };
        }
        return state;
      });
    },
  }),
);
