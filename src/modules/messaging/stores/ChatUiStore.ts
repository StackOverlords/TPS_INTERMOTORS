import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatViewMode = "floating" | "side";

interface FloatingPos {
  x: number;
  y: number;
}
interface FloatingSize {
  w: number;
  h: number;
}

interface ChatUIState {
  isOpen: boolean;
  isMinimized: boolean;
  viewMode: ChatViewMode;
  floatingPos: FloatingPos;
  floatingSize: FloatingSize;
  fabHidden: boolean;
  // ── Scroll preservation ──
  conversationListScroll: number;
  chatPositionOnEnter: number;
  lastVisitedChatId: number | null;
}

interface ChatUIActions {
  open: (mode?: ChatViewMode) => void;
  close: () => void;
  toggleMinimize: () => void;
  setViewMode: (mode: ChatViewMode) => void;
  setFloatingPos: (pos: FloatingPos) => void;
  setFloatingSize: (size: FloatingSize) => void;
  setFabHidden: (hidden: boolean) => void;
  // ── Scroll preservation ──
  setConversationListScroll: (y: number) => void;
  setChatPositionOnEnter: (pos: number) => void;
  setLastVisitedChatId: (id: number | null) => void;
}

const DEFAULT_SIZE: FloatingSize = { w: 420, h: 580 };

function getDefaultPos(): FloatingPos {
  if (typeof window === "undefined") return { x: 100, y: 100 };
  return {
    x: window.innerWidth - DEFAULT_SIZE.w - 24,
    y: window.innerHeight - DEFAULT_SIZE.h - 24,
  };
}

export const useChatUIStore = create<ChatUIState & ChatUIActions>()(
  persist(
    (set) => ({
      isOpen: false,
      isMinimized: false,
      viewMode: "floating",
      floatingPos: getDefaultPos(),
      floatingSize: DEFAULT_SIZE,
      fabHidden: false,
      conversationListScroll: 0,
      chatPositionOnEnter: -1,
      lastVisitedChatId: null,

      open: (mode) =>
        set((s) => ({
          isOpen: true,
          isMinimized: false,
          viewMode: mode ?? s.viewMode,
        })),

      close: () => set({ isOpen: false, isMinimized: false }),

      toggleMinimize: () => set((s) => ({ isMinimized: !s.isMinimized })),

      setViewMode: (mode) => set({ viewMode: mode }),

      setFloatingPos: (pos) => set({ floatingPos: pos }),

      setFloatingSize: (size) => set({ floatingSize: size }),

      setFabHidden: (hidden) => set({ fabHidden: hidden }),

      setConversationListScroll: (y) => set({ conversationListScroll: y }),
      setChatPositionOnEnter: (pos) => set({ chatPositionOnEnter: pos }),
      setLastVisitedChatId: (id) => set({ lastVisitedChatId: id }),
    }),
    {
      name: "chat-ui-store",
      // Only persist layout preferences
      partialize: (s) => ({
        viewMode: s.viewMode,
        floatingPos: s.floatingPos,
        floatingSize: s.floatingSize,
        fabHidden: s.fabHidden,
      }),
    },
  ),
);
