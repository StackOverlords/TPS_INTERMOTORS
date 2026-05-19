/**
 * offlineQueueStore.ts
 *
 * Cola de mensajes pendientes para envío offline.
 * Persiste en disco via @tauri-apps/plugin-store para sobrevivir reinicios.
 *
 * Requiere en Cargo.toml:
 *   tauri-plugin-store = "2"
 *
 * Y en main.rs:
 *   .plugin(tauri_plugin_store::Builder::default().build())
 */

import { load, type Store } from "@tauri-apps/plugin-store";
import { create } from "zustand";
import type { OfflineQueueItem } from "../types/Message.types";

// ─────────────────────────────────────────────────────────────────────────────
// TAURI STORE SINGLETON
// ─────────────────────────────────────────────────────────────────────────────

const STORE_FILE = "messaging_offline.json";
const QUEUE_KEY = "offline_queue";
const MAX_ATTEMPTS = 3;

let tauriStore: Store | null = null;

async function getTauriStore(): Promise<Store> {
  if (!tauriStore) {
    tauriStore = await load(STORE_FILE, { defaults: {}, autoSave: true });
  }
  return tauriStore;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function persistQueue(queue: OfflineQueueItem[]): Promise<void> {
  try {
    const store = await getTauriStore();
    await store.set(QUEUE_KEY, queue);
  } catch (err) {
    console.error("[OfflineQueue] Failed to persist queue:", err);
  }
}

async function loadQueueFromDisk(): Promise<OfflineQueueItem[]> {
  try {
    const store = await getTauriStore();
    const saved = await store.get<OfflineQueueItem[]>(QUEUE_KEY);
    return saved ?? [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

interface OfflineQueueState {
  queue: OfflineQueueItem[];
  isOnline: boolean;
  isSyncing: boolean;
  initialized: boolean;
}

interface OfflineQueueActions {
  initialize: () => Promise<void>;
  enqueue: (item: Omit<OfflineQueueItem, "attempts">) => Promise<void>;
  dequeue: (tempId: string) => Promise<void>;
  incrementAttempts: (tempId: string) => Promise<void>;
  removeExpired: () => Promise<void>;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  getQueueForChat: (chatId: number) => OfflineQueueItem[];
  getPendingCount: () => number;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useOfflineQueueStore = create<
  OfflineQueueState & OfflineQueueActions
>()((set, get) => ({
  queue: [],
  isOnline: navigator.onLine,
  isSyncing: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    const savedQueue = await loadQueueFromDisk();
    set({ queue: savedQueue, initialized: true });
  },

  enqueue: async (item) => {
    const newItem: OfflineQueueItem = { ...item, attempts: 0 };
    const updated = [...get().queue, newItem];
    set({ queue: updated });
    await persistQueue(updated);
  },

  dequeue: async (tempId) => {
    const updated = get().queue.filter((i) => i.tempId !== tempId);
    set({ queue: updated });
    await persistQueue(updated);
  },

  incrementAttempts: async (tempId) => {
    const updated = get().queue.map((i) =>
      i.tempId === tempId ? { ...i, attempts: i.attempts + 1 } : i,
    );
    set({ queue: updated });
    await persistQueue(updated);
  },

  removeExpired: async () => {
    const updated = get().queue.filter((i) => i.attempts < MAX_ATTEMPTS);
    set({ queue: updated });
    await persistQueue(updated);
  },

  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),

  getQueueForChat: (chatId) => get().queue.filter((i) => i.chatId === chatId),

  getPendingCount: () => get().queue.length,
}));

// ─────────────────────────────────────────────────────────────────────────────
// ONLINE/OFFLINE EVENT LISTENER (inicializar una sola vez en app root)
// ─────────────────────────────────────────────────────────────────────────────

export function initOfflineListener(): () => void {
  const store = useOfflineQueueStore.getState();

  const handleOnline = () => {
    store.setOnline(true);
  };

  const handleOffline = () => {
    store.setOnline(false);
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Inicializar cola desde disco
  void store.initialize();

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
