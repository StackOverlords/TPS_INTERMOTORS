import { environment } from "@/utils/environment";
import { create } from 'zustand';

interface BranchState {
  selectedBranchId: string | null;
  setSelectedBranch: (branchId: string) => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  selectedBranchId: localStorage.getItem(environment.branch_selected_key) || null,

  setSelectedBranch: (branchId) => {
    // Logger.info("Seleccionando nueva branch", branchId)
    localStorage.setItem(environment.branch_selected_key, branchId);
    set({ selectedBranchId: branchId });
  },
}));