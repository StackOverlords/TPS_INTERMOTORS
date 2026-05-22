import { queryClient } from "@/lib/reactQueryConfig";
import authSDK from "@/services/sdk-simple-auth";
import { environment } from "@/utils/environment";
import { create } from 'zustand';

export function getBranchKey(userId?: number | string | null): string {
  return userId
    ? `${environment.branch_selected_key}_user_${userId}`
    : environment.branch_selected_key;
}

interface BranchState {
  selectedBranchId: string | null;
  setSelectedBranch: (branchId: string) => void;
  restoreForUser: (userId: string | number) => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  selectedBranchId: null,

  setSelectedBranch: (branchId) => {
    const userId = authSDK.getCurrentUser()?.id;
    localStorage.setItem(getBranchKey(userId), branchId);
    set({ selectedBranchId: branchId });
    queryClient.invalidateQueries();
  },

  restoreForUser: (userId) => {
    const saved = localStorage.getItem(getBranchKey(userId));
    set({ selectedBranchId: saved || null });
  },
}));
