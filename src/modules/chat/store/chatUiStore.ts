import { create } from "zustand";

interface ChatUiState {
  isOpen: boolean;
  activeConversationId: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setActiveConversation: (id: string | null) => void;
}

export const useChatUiStore = create<ChatUiState>((set) => ({
  isOpen: false,
  activeConversationId: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveConversation: (id) => set({ activeConversationId: id }),
}));
