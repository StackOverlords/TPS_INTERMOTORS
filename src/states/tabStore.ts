import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Tab {
  id: string;
  path: string;
  title: string;
  icon?: any;
  // Estado del scroll para cada tab
  scrollPosition?: number;
  // Metadata adicional que puedas necesitar
  metadata?: Record<string, any>;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;

  // Acciones
  addTab: (path: string, title: string, icon?: any) => string;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  getTab: (tabId: string) => Tab | undefined;
  findTabByPath: (path: string) => Tab | undefined;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

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
      console.error('Error leyendo tab storage, limpiando datos corruptos:', error);
      // Limpiar datos corruptos
      try {
        localStorage.removeItem(name);
      } catch (e) {
        console.error('Error limpiando storage:', e);
      }
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Error guardando tab storage:', error);
      // Si falla por quota, limpiar storage antiguo
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem(name);
        } catch (e) {
          console.error('Error limpiando storage por quota:', e);
        }
      }
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removiendo tab storage:', error);
    }
  }
}));

// Helper para debounce
const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      addTab: (path: string, title: string, icon?: any) => {
        const state = get();

        // Verificar si ya existe un tab con esta ruta
        const existingTab = state.tabs.find(tab => tab.path === path);

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
          metadata: {}
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

        if (tabIndex === -1) return;

        const newTabs = state.tabs.filter(tab => tab.id !== tabId);

        // Si estamos cerrando el tab activo, activar otro
        let newActiveTabId = state.activeTabId;

        if (state.activeTabId === tabId && newTabs.length > 0) {
          // Activar el tab a la derecha, o el de la izquierda si es el último
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
          // Usar shallow update para evitar re-renders innecesarios
          set({ activeTabId: tabId }, false, 'setActiveTab');
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

      findTabByPath: (path: string) => {
        return get().tabs.find(tab => tab.path === path);
      },

      reorderTabs: (fromIndex: number, toIndex: number) => {
        set(state => {
          const newTabs = [...state.tabs];
          const [movedTab] = newTabs.splice(fromIndex, 1);
          newTabs.splice(toIndex, 0, movedTab);
          return { tabs: newTabs };
        });
      }
    }),
    {
      name: 'tab-storage',
      storage: safeStorage,
      version: 1,
      // Optimización: solo persistir cambios estructurales, no activeTabId
      partialize: (state) => ({
        tabs: state.tabs,
        // No persistir activeTabId para evitar escrituras constantes
      }),
      // Manejar errores de migración
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Error rehidratando tab storage:', error);
          // Limpiar storage corrupto
          try {
            localStorage.removeItem('tab-storage');
          } catch (e) {
            console.error('Error limpiando tab storage corrupto:', e);
          }
        }
      }
    }
  )
);
