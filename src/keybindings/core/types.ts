// Core types for the keybinding system

/**
 * Representa una definición de comando en el sistema
 */
export interface CommandDefinition {
  /** Combinación de teclas por defecto (ej: 'ctrl+s', 'alt+shift+p') */
  defaultKeys: string;
  /** Descripción legible del comando */
  description: string;
  /** Condición para habilitar el comando (ej: 'formFocus', 'modalOpen') */
  when?: string;
  /** Categoría visual para agrupar en UI */
  category?: string;
}

/**
 * Representa un keybinding cargado (con customización del usuario)
 */
export interface KeybindingEntry {
  /** ID único del comando (ej: 'forms.save') */
  id: string;
  /** Teclas actuales (puede ser personalizado) */
  keys: string;
  /** Teclas por defecto originales */
  defaultKeys: string;
  /** Descripción del comando */
  description: string;
  /** Categoría del comando */
  category: string;
  /** Si está personalizado por el usuario */
  isCustom: boolean;
  /** Condición when del comando */
  when?: string;
}

/**
 * Estado del store de keybindings
 */
export interface KeybindingState {
  /** Mapa de todos los keybindings cargados */
  keybindings: Map<string, KeybindingEntry>;
  /** Si está cargando desde la DB */
  loading: boolean;
  /** Si ya se inicializó */
  initialized: boolean;
}

/**
 * Acciones del store de keybindings
 */
export interface KeybindingActions {
  /** Carga todos los keybindings desde la DB */
  load: () => Promise<void>;
  /** Guarda un keybinding personalizado */
  save: (id: string, keys: string) => Promise<void>;
  /** Resetea un keybinding a su valor default */
  reset: (id: string) => Promise<void>;
  /** Resetea todos los keybindings */
  resetAll: () => Promise<void>;
  /** Exporta keybindings a JSON */
  export: () => Promise<string>;
  /** Importa keybindings desde JSON */
  import: (json: string, mode: ImportMode) => Promise<void>;
  /** Obtiene las teclas de un comando específico */
  getKeys: (commandId: string) => string | undefined;
  /** Valida si hay conflictos en una combinación de teclas */
  hasConflict: (keys: string, excludeId?: string) => boolean;
}

/**
 * Store completo de keybindings
 */
export type KeybindingStore = KeybindingState & KeybindingActions;

/**
 * Modo de importación de keybindings
 */
export type ImportMode = 'replace' | 'merge' | 'add-only';

/**
 * Opciones para el hook useCommand
 */
export interface UseCommandOptions {
  /** Si el comando está habilitado */
  enabled?: boolean;
  /** Si debe funcionar en form tags (input, textarea, select) */
  enableOnFormTags?: boolean;
  /** Prevenir default del evento */
  preventDefault?: boolean;
}

/**
 * Contexto de ejecución para comandos
 */
export type ExecutionContext =
  | 'global'        // Siempre disponible
  | 'formFocus'     // Cuando hay foco en un formulario
  | 'modalOpen'     // Cuando hay un modal abierto
  | 'tableFocus'    // Cuando hay foco en una tabla
  | 'editorFocus';  // Cuando hay foco en un editor

/**
 * Resultado de validación de conflictos
 */
export interface ConflictValidation {
  /** Si hay conflicto */
  hasConflict: boolean;
  /** IDs de comandos en conflicto */
  conflictingIds: string[];
  /** Mensaje descriptivo del conflicto */
  message?: string;
}
