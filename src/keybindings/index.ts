/**
 * Punto de entrada principal del sistema de keybindings
 */

// Core
export { COMMANDS, CATEGORIES, type CommandId, type CategoryId } from './core/commands';
export type {
  CommandDefinition,
  KeybindingEntry,
  KeybindingState,
  KeybindingActions,
  KeybindingStore,
  ImportMode,
  UseCommandOptions,
  ExecutionContext,
  ConflictValidation,
} from './core/types';
export {
  setContext,
  getContext,
  getAllContexts,
  evaluateWhenClause,
  subscribeToContextChanges,
} from './core/contexts';

// Store
export {
  useKeybindingStore,
  initializeKeybindingStore,
  useKeybinding,
  useKeybindingKeys,
} from './store/keybindingStore';

// Hooks
export {
  useCommand,
  useConditionalCommand,
  useCommands,
  useCommandKeys,
} from './hooks/useCommand';

// Utils
export {
  normalizeKeys,
  areKeysEqual,
  parseKeyboardEvent,
  isValidKeyCombo,
  formatKeysForDisplay,
  isSystemReserved,
} from './utils/parser';
export {
  validateKeybinding,
  detectConflicts,
  validateConflict,
  getUsedKeys,
  suggestAlternativeKeys,
} from './utils/validator';
