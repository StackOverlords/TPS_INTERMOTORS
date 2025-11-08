// ⚠️ DEPRECATED: Este servicio está siendo reemplazado por el nuevo sistema de keybindings
// Ver: /src/keybindings/store/persistence.ts y /src/keybindings/store/keybindingStore.ts
//
// Este archivo se mantiene temporalmente para compatibilidad con hooks antiguos
// que aún no han sido migrados. Una vez que todos los componentes usen el nuevo
// sistema, este archivo será eliminado.

import { getAllKeybindings, saveKeybinding } from "@/database/schemas/keybindings.schema";
import { getPreference, savePreference } from "@/database/schemas/preferences.schema";
import { COMMANDS } from "@/keybindings";

const MIGRATION_KEY = 'keybindings_migrated';

// Cache global para evitar múltiples lecturas de DB
let keybindingsCache: Map<string, LoadedKeybinding> | null = null;

// Sistema de eventos para notificar cambios
type KeybindingsListener = () => void;
const listeners: Set<KeybindingsListener> = new Set();

/**
 * Suscribirse a cambios en keybindings
 */
export const subscribeToKeybindingsChanges = (listener: KeybindingsListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Notificar a todos los listeners que los keybindings cambiaron
 */
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};


//Estructura para keybindings cargados (mergeados)
export interface LoadedKeybinding {
  id: string;
  keys: string;
  defaultKeys: string;
  description: string;
  category: string;
  isCustom: boolean;
}


//Migra los keybindings por defecto de global.keys.ts a la base de datos
//Solo se ejecuta la primera vez que se abre la aplicación
export const migrateDefaultKeybindings = async (): Promise<void> => {
  try {
    // Verificar si ya se migró
    const migrated = await getPreference<boolean>(MIGRATION_KEY, false);

    if (migrated) {
      return;
    }


    // Migrar cada keybinding desde COMMANDS
    for (const [id, config] of Object.entries(COMMANDS)) {
      // Guardar como default en la DB
      await saveKeybinding(id, config.defaultKeys, config.defaultKeys);
    }

    // Marcar como migrado
    await savePreference(MIGRATION_KEY, true);
  } catch (error) {
    throw error;
  }
};


//Carga todos los keybindings desde la DB
//Retorna una estructura fácil de usar por los hooks
export const loadKeybindings = async (): Promise<Map<string, LoadedKeybinding>> => {
  try {
    // Si ya está en cache, retornar cache
    if (keybindingsCache) {
      return keybindingsCache;
    }

    // Primero asegurar migración
    await migrateDefaultKeybindings();

    // Obtener keybindings personalizados de DB
    const customBindings = await getAllKeybindings();
    const customMap = new Map<string, string>();

    customBindings.forEach(kb => {
      customMap.set(kb.id, kb.keys);
    });

    // Crear estructura completa mezclando defaults + customs
    const allKeybindings = new Map<string, LoadedKeybinding>();

    for (const [id, config] of Object.entries(COMMANDS)) {
      const customKeys = customMap.get(id);

      allKeybindings.set(id, {
        id,
        keys: customKeys || config.defaultKeys, // Custom o default
        defaultKeys: config.defaultKeys,
        description: config.description,
        category: config.category || 'unknown',
        isCustom: !!customKeys,
      });
    }

    // Guardar en cache
    keybindingsCache = allKeybindings;

    return allKeybindings;
  } catch (error) {
    // En caso de error, retornar solo los defaults
    const fallbackMap = new Map<string, LoadedKeybinding>();

    for (const [id, config] of Object.entries(COMMANDS)) {
      fallbackMap.set(id, {
        id,
        keys: config.defaultKeys,
        defaultKeys: config.defaultKeys,
        description: config.description,
        category: config.category || 'unknown',
        isCustom: false,
      });
    }

    return fallbackMap;
  }
};


//Obtiene las teclas para un keybinding específico
//Si no existe custom, retorna el default
export const getKeybindingKeys = async (id: string): Promise<string | null> => {
  const keybindings = await loadKeybindings();
  return keybindings.get(id)?.keys || null;
};


//Obtiene todas las teclas de una categoría específica
export const getKeybindingsByCategory = async (category: string): Promise<Map<string, string>> => {
  const allKeybindings = await loadKeybindings();
  const categoryBindings = new Map<string, string>();

  allKeybindings.forEach((kb, id) => {
    if (kb.category === category) {
      categoryBindings.set(id, kb.keys);
    }
  });

  return categoryBindings;
};


//Limpia el cache de keybindings y notifica a los listeners
//Útil después de guardar cambios en settings
export const clearKeybindingsCache = async (): Promise<void> => {
  keybindingsCache = null;

  // Recargar el cache ANTES de notificar
  await loadKeybindings();

  // Ahora notificar con el cache actualizado
  //ESTO PARA QUE LOS HOOKS RECARGUEN EN TODAS LAS PAGINAS.
  notifyListeners();
};

//Obtiene las teclas de forma síncrona desde el cache
//Retorna el default si no está en cache
export const getKeysSync = (id: string): string => {

  if (keybindingsCache) {
    const kb = keybindingsCache.get(id);
    if (kb) return kb.keys;
  }

  // Fallback a COMMANDS
  const command = COMMANDS[id as keyof typeof COMMANDS];
  if (command) {
    return command.defaultKeys;
  }

  return '';
};
