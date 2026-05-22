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

export const DEFAULT_FLOATING_SIZE: FloatingSize = { w: 420, h: 580 };

function getDefaultPos(): FloatingPos {
  if (typeof window === "undefined") return { x: 100, y: 100 };
  return {
    x: window.innerWidth - DEFAULT_FLOATING_SIZE.w - 24,
    y: window.innerHeight - DEFAULT_FLOATING_SIZE.h - 24,
  };
}

interface ChatUIState {
  isOpen: boolean;
  isMinimized: boolean;
  viewMode: ChatViewMode;
  floatingPos: FloatingPos;
  floatingSize: FloatingSize;
  isMaximized: boolean;
  preMaximizeLayout: { pos: FloatingPos; size: FloatingSize } | null;
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
  setIsMaximized: (v: boolean) => void;
  setPreMaximizeLayout: (layout: { pos: FloatingPos; size: FloatingSize } | null) => void;
  // ── Scroll preservation ──
  setConversationListScroll: (y: number) => void;
  setChatPositionOnEnter: (pos: number) => void;
  setLastVisitedChatId: (id: number | null) => void;
}

export const useChatUIStore = create<ChatUIState & ChatUIActions>()(
  persist(
    (set) => ({
      isOpen: false,
      isMinimized: false,
      viewMode: "floating",
      floatingPos: getDefaultPos(),
      floatingSize: DEFAULT_FLOATING_SIZE,
      isMaximized: false,
      preMaximizeLayout: null,
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

      setIsMaximized: (v) => set({ isMaximized: v }),

      setPreMaximizeLayout: (layout) => set({ preMaximizeLayout: layout }),

      setConversationListScroll: (y) => set({ conversationListScroll: y }),
      setChatPositionOnEnter: (pos) => set({ chatPositionOnEnter: pos }),
      setLastVisitedChatId: (id) => set({ lastVisitedChatId: id }),
    }),
    {
      name: "chat-ui-store",
      partialize: (s) => ({
        viewMode: s.viewMode,
        floatingPos: s.floatingPos,
        floatingSize: s.floatingSize,
        isMaximized: s.isMaximized,
        preMaximizeLayout: s.preMaximizeLayout,
      }),
    },
  ),
);
