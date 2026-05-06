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
}

interface ChatUIActions {
  open: (mode?: ChatViewMode) => void;
  close: () => void;
  toggleMinimize: () => void;
  setViewMode: (mode: ChatViewMode) => void;
  setFloatingPos: (pos: FloatingPos) => void;
  setFloatingSize: (size: FloatingSize) => void;
  setFabHidden: (hidden: boolean) => void;
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
