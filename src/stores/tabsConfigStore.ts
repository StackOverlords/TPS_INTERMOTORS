import { TABS_CONFIG } from '@/config/tabsConfig';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MIN_MOUNTED_TABS = 3;
const MAX_MOUNTED_TABS_LIMIT = 20;

interface TabsConfigState {
  maxMountedTabs: number;
  setMaxMountedTabs: (value: number) => void;
  reset: () => void;
}

export const useTabsConfigStore = create<TabsConfigState>()(
  persist(
    (set) => ({
      maxMountedTabs: TABS_CONFIG.MAX_MOUNTED_TABS,
      setMaxMountedTabs: (value: number) =>
        set({ maxMountedTabs: Math.max(MIN_MOUNTED_TABS, Math.min(MAX_MOUNTED_TABS_LIMIT, value)) }),
      reset: () => set({ maxMountedTabs: TABS_CONFIG.MAX_MOUNTED_TABS }),
    }),
    {
      name: 'tabs-config-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { MAX_MOUNTED_TABS_LIMIT, MIN_MOUNTED_TABS };
