import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { debounce } from 'lodash-es';

export interface Tab {
  id: string;
  path: string;
  title: string;
  icon?: any;
  // Estado del scroll para cada tab
  scrollPosition?: number;
  // Metadata adicional que puedas necesitar
  metadata?: Record<string, any>;
  // ID de instancia para permitir múltiples tabs con la misma ruta
  instanceId?: string;
  pinned?: boolean;
  createdTempData?: {
    createdEntity?: any;
    fromCreate?: boolean;
    mode?: string;
    originalPath?: string;
  };
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;

  // Acciones
  addTab: (path: string, title: string, icon?: any, instanceId?: string, metadata?: Record<string, any>) => string;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  getTab: (tabId: string) => Tab | undefined;
  findTabByPath: (path: string, instanceId?: string) => Tab | undefined;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
}

// Debounced setItem para evitar thrashing de localStorage durante drag & drop
const debouncedSetItem = debounce(
  (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      // Si falla por quota, limpiar storage antiguo
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem(name);
        } catch (e) {
          // console.error('Error limpiando storage por quota:', e);
        }
      }
    }
  },
  300, // Esperar 300ms después del último cambio antes de guardar
  { leading: false, trailing: true } // Solo ejecutar al final, no al inicio
);

// Exponer flush para forzar guardado inmediato (usado en beforeunload)
export const flushTabStorage = () => {
  debouncedSetItem.flush();
};

// Storage wrapper con manejo de errores robusto
const safeStorage = createJSONStorage<TabState>(() => ({
  getItem: (name: string) => {
    try {
      const value = localStorage.getItem(name);
      if (!value) return null;

      // Validar que sea JSON válido
      JSON.parse(value);
      return value;
    } catch (error) {
      // console.error('Error leyendo tab storage, limpiando datos corruptos:', error);
      // Limpiar datos corruptos
      try {
        localStorage.removeItem(name);
      } catch (e) {
        // console.error('Error limpiando storage:', e);
      }
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    // ✅ Usar versión con debounce para evitar múltiples writes durante drag & drop
    debouncedSetItem(name, value);
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      // console.error('Error removiendo tab storage:', error);
    }
  }
}));

// Helper para debounce
// const debounce = <T extends (...args: any[]) => any>(
//   fn: T,
//   delay: number
// ): ((...args: Parameters<T>) => void) => {
//   let timeoutId: ReturnType<typeof setTimeout> | null = null;
//   return (...args: Parameters<T>) => {
//     if (timeoutId) clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => fn(...args), delay);
//   };
// };

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      addTab: (path: string, title: string, icon?: any, instanceId?: string, metadata?: Record<string, any>) => {
        const state = get();

        // Verificar si ya existe un tab con esta ruta E instanceId
        const existingTab = state.tabs.find(tab =>
          tab.path === path && tab.instanceId === instanceId
        );

        if (existingTab) {
          // Si existe, solo activarlo
          set({ activeTabId: existingTab.id });
          return existingTab.id;
        }

        // Crear nuevo tab
        const newTab: Tab = {
          id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          path,
          title,
          icon,
          scrollPosition: 0,
          metadata: metadata || {},
          instanceId
        };

        set(state => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id
        }));

        return newTab.id;
      },

      removeTab: (tabId: string) => {
        const state = get();

        const tabIndex = state.tabs.findIndex(tab => tab.id === tabId);

        if (tabIndex === -1) {
          return;
        }

        const newTabs = state.tabs.filter(tab => tab.id !== tabId);
        // Si estamos cerrando el tab activo, activar otro
        let newActiveTabId = state.activeTabId;
        if (state.activeTabId === tabId && newTabs.length > 0) {
          const newIndex = tabIndex < newTabs.length ? tabIndex : tabIndex - 1;
          newActiveTabId = newTabs[newIndex]?.id || null;
        } else if (newTabs.length === 0) {
          newActiveTabId = null;
        }

        set({
          tabs: newTabs,
          activeTabId: newActiveTabId
        });
      },

      setActiveTab: (tabId: string) => {
        const state = get();
        const tab = state.tabs.find(t => t.id === tabId);

        if (tab) {
          set({ activeTabId: tabId });
        }
      },

      updateTab: (tabId: string, updates: Partial<Tab>) => {
        set(state => ({
          tabs: state.tabs.map(tab =>
            tab.id === tabId
              ? { ...tab, ...updates }
              : tab
          )
        }));
      },

      closeAllTabs: () => {
        set({ tabs: [], activeTabId: null });
      },

      closeOtherTabs: (tabId: string) => {
        const state = get();
        const tab = state.tabs.find(t => t.id === tabId);

        if (tab) {
          set({
            tabs: [tab],
            activeTabId: tabId
          });
        }
      },

      getTab: (tabId: string) => {
        return get().tabs.find(tab => tab.id === tabId);
      },

      findTabByPath: (path: string, instanceId?: string) => {
        return get().tabs.find(tab =>
          tab.path === path && tab.instanceId === instanceId
        );
      },

      reorderTabs: (fromIndex: number, toIndex: number) => {
        set(state => {
          const newTabs = [...state.tabs];
          const [movedTab] = newTabs.splice(fromIndex, 1);
          newTabs.splice(toIndex, 0, movedTab);
          return { tabs: newTabs };
        });
      },

      pinTab: (tabId: string) => {
        set(state => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab || tab.pinned) return state;
          // Mover al frente del grupo pinned (antes de las no-pinned)
          const withoutTab = state.tabs.filter(t => t.id !== tabId);
          const lastPinnedIndex = withoutTab.reduce((acc, t, i) => t.pinned ? i : acc, -1);
          const newTabs = [...withoutTab];
          newTabs.splice(lastPinnedIndex + 1, 0, { ...tab, pinned: true });
          return { tabs: newTabs };
        });
      },

      unpinTab: (tabId: string) => {
        set(state => ({
          tabs: state.tabs.map(t => t.id === tabId ? { ...t, pinned: false } : t)
        }));
      },
    }),
    {
      name: 'tab-storage',
      storage: safeStorage,
      version: 4, // Incrementar versión para forzar limpieza de tabs con iconos
      partialize: (state) => ({
        // NO persistir los iconos porque son componentes de React y no se pueden serializar
        tabs: state.tabs.map(tab => ({
          id: tab.id,
          path: tab.path,
          title: tab.title,
          scrollPosition: tab.scrollPosition,
          metadata: tab.metadata,
          instanceId: tab.instanceId,
          pinned: tab.pinned,
          // Omitir icon intencionalmente
        })),
      }),
      migrate: (persistedState: any, version: number) => {
        if (version < 4 && persistedState?.tabs) {
          return {
            tabs: [],
            activeTabId: null
          } as any;
        }
        return persistedState;
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          // Limpiar storage corrupto
          try {
            localStorage.removeItem('tab-storage');
          } catch (e) {
          }
        }
      }
    }
  )
);
