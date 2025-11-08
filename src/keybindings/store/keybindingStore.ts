/**
 * Store reactivo de keybindings usando Zustand
 * Proporciona reactividad automática sin necesidad de subscripciones manuales
 */

import { create } from 'zustand';
import type { KeybindingStore } from '../core/types';
import { COMMANDS } from '../core/commands';
import {
  loadAllKeybindings,
  saveKeybinding as persistSaveKeybinding,
  deleteKeybinding as persistDeleteKeybinding,
  resetAllKeybindings as persistResetAll,
  exportKeybindings as persistExport,
  importKeybindings as persistImport,
} from './persistence';

/**
 * Store global de keybindings
 * Se auto-inicializa al primer acceso
 */
export const useKeybindingStore = create<KeybindingStore>((set, get) => ({
  // ==================== STATE ====================
  keybindings: new Map(),
  loading: false,
  initialized: false,

  // ==================== ACTIONS ====================

  /**
   * Carga todos los keybindings desde la DB
   */
  load: async () => {
    const { initialized, loading } = get();

    // Evitar cargas duplicadas
    if (initialized || loading) return;

    set({ loading: true });

    try {
      const keybindings = await loadAllKeybindings();
      set({ keybindings, initialized: true, loading: false });
    } catch (error) {
      console.error('Error loading keybindings:', error);
      set({ loading: false });
    }
  },

  /**
   * Guarda un keybinding personalizado
   * ✨ Reactivo: todos los useCommand hooks se actualizan automáticamente
   */
  save: async (id: string, keys: string) => {
    try {
      // Guardar en DB
      await persistSaveKeybinding(id, keys);

      // Actualizar store (esto dispara re-renders automáticamente)
      const { keybindings } = get();
      const entry = keybindings.get(id);

      if (entry) {
        const updated = new Map(keybindings);
        updated.set(id, {
          ...entry,
          keys,
          isCustom: true,
        });
        set({ keybindings: updated });
      }
    } catch (error) {
      console.error('Error saving keybinding:', error);
      throw error;
    }
  },

  /**
   * Resetea un keybinding a su valor default
   */
  reset: async (id: string) => {
    try {
      // Eliminar de DB
      await persistDeleteKeybinding(id);

      // Actualizar store
      const { keybindings } = get();
      const entry = keybindings.get(id);

      if (entry) {
        const updated = new Map(keybindings);
        updated.set(id, {
          ...entry,
          keys: entry.defaultKeys,
          isCustom: false,
        });
        set({ keybindings: updated });
      }
    } catch (error) {
      console.error('Error resetting keybinding:', error);
      throw error;
    }
  },

  /**
   * Resetea todos los keybindings
   */
  resetAll: async () => {
    try {
      await persistResetAll();

      // Recargar desde defaults
      const { keybindings } = get();
      const updated = new Map(keybindings);

      // Resetear todas las entradas
      for (const [id, entry] of updated.entries()) {
        updated.set(id, {
          ...entry,
          keys: entry.defaultKeys,
          isCustom: false,
        });
      }

      set({ keybindings: updated });
    } catch (error) {
      console.error('Error resetting all keybindings:', error);
      throw error;
    }
  },

  /**
   * Exporta keybindings a JSON
   */
  export: async () => {
    const { keybindings } = get();
    return persistExport(keybindings);
  },

  /**
   * Importa keybindings desde JSON
   */
  import: async (json: string, mode = 'merge') => {
    try {
      await persistImport(json, mode);

      // Recargar todo el store
      await get().load();
    } catch (error) {
      console.error('Error importing keybindings:', error);
      throw error;
    }
  },

  /**
   * Obtiene las teclas de un comando específico
   */
  getKeys: (commandId: string) => {
    const { keybindings } = get();
    return keybindings.get(commandId)?.keys;
  },

  /**
   * Verifica si hay conflictos con una combinación de teclas
   */
  hasConflict: (keys: string, excludeId?: string) => {
    const { keybindings } = get();

    for (const [id, entry] of keybindings.entries()) {
      if (id === excludeId) continue;
      if (entry.keys === keys) return true;
    }

    return false;
  },
}));

/**
 * Inicializa el store (debe llamarse en el inicio de la app)
 */
export async function initializeKeybindingStore(): Promise<void> {
  await useKeybindingStore.getState().load();
}

/**
 * Hook para obtener un keybinding específico de forma reactiva
 */
export function useKeybinding(commandId: string) {
  return useKeybindingStore(
    state => state.keybindings.get(commandId)
  );
}

/**
 * Hook para obtener las teclas de un comando de forma reactiva
 */
export function useKeybindingKeys(commandId: string): string {
  const entry = useKeybinding(commandId);

  // Fallback a default si no está en el store
  if (!entry) {
    const command = COMMANDS[commandId as keyof typeof COMMANDS];
    return command?.defaultKeys || '';
  }

  return entry.keys;
}
