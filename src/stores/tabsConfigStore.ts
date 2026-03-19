import { TABS_CONFIG } from '@/config/tabsConfig';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MIN_MOUNTED_TABS = 3;
const MAX_MOUNTED_TABS_LIMIT = 20;

type TabOverflowMode = 'compress' | 'scroll';

interface TabsConfigState {
  maxMountedTabs: number;
  tabOverflowMode: TabOverflowMode;
  setMaxMountedTabs: (value: number) => void;
  setTabOverflowMode: (mode: TabOverflowMode) => void;
  reset: () => void;
}

export const useTabsConfigStore = create<TabsConfigState>()(
  persist(
    (set) => ({
      maxMountedTabs: TABS_CONFIG.MAX_MOUNTED_TABS,
      tabOverflowMode: 'compress',
      setMaxMountedTabs: (value: number) =>
        set({ maxMountedTabs: Math.max(MIN_MOUNTED_TABS, Math.min(MAX_MOUNTED_TABS_LIMIT, value)) }),
      setTabOverflowMode: (mode: TabOverflowMode) => set({ tabOverflowMode: mode }),
      reset: () => set({ maxMountedTabs: TABS_CONFIG.MAX_MOUNTED_TABS, tabOverflowMode: 'compress' }),
    }),
    {
      name: 'tabs-config-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { MAX_MOUNTED_TABS_LIMIT, MIN_MOUNTED_TABS };
export type { TabOverflowMode };
