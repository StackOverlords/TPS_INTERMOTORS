/**
 * Utilidades para validar keybindings y detectar conflictos
 */

import type { KeybindingEntry, ConflictValidation } from '../core/types';
import { isValidKeyCombo, areKeysEqual } from './parser';

/**
 * Valida un keybinding individual
 */
export function validateKeybinding(
  id: string,
  keys: string
): { valid: boolean; error?: string } {
  // Validar que el ID no esté vacío
  if (!id || id.trim() === '') {
    return { valid: false, error: 'El ID del comando no puede estar vacío' };
  }

  // Validar que las teclas no estén vacías
  if (!keys || keys.trim() === '') {
    return { valid: false, error: 'La combinación de teclas no puede estar vacía' };
  }

  // Validar formato de teclas
  if (!isValidKeyCombo(keys)) {
    return { valid: false, error: 'Combinación de teclas inválida' };
  }

  return { valid: true };
}

/**
 * Detecta conflictos entre keybindings
 */
export function detectConflicts(
  keybindings: Map<string, KeybindingEntry>
): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  const keysToIds = new Map<string, string[]>();

  // Agrupar IDs por combinación de teclas
  for (const [id, entry] of keybindings.entries()) {
    const existing = keysToIds.get(entry.keys) || [];
    existing.push(id);
    keysToIds.set(entry.keys, existing);
  }

  // Identificar conflictos (más de un ID con las mismas teclas)
  for (const [keys, ids] of keysToIds.entries()) {
    if (ids.length > 1) {
      ids.forEach(id => conflicts.set(id, ids.filter(i => i !== id)));
    }
  }

  return conflicts;
}

/**
 * Valida si una combinación de teclas entra en conflicto
 */
export function validateConflict(
  keys: string,
  keybindings: Map<string, KeybindingEntry>,
  excludeId?: string
): ConflictValidation {
  const conflictingIds: string[] = [];

  for (const [id, entry] of keybindings.entries()) {
    if (id === excludeId) continue;

    if (areKeysEqual(entry.keys, keys)) {
      conflictingIds.push(id);
    }
  }

  const hasConflict = conflictingIds.length > 0;

  return {
    hasConflict,
    conflictingIds,
    message: hasConflict
      ? `Esta combinación ya está asignada a: ${conflictingIds.join(', ')}`
      : undefined,
  };
}

/**
 * Obtiene todas las combinaciones de teclas usadas (excepto una específica)
 */
export function getUsedKeys(
  keybindings: Map<string, KeybindingEntry>,
  excludeId?: string
): string[] {
  const usedKeys: string[] = [];

  for (const [id, entry] of keybindings.entries()) {
    if (id !== excludeId) {
      usedKeys.push(entry.keys);
    }
  }

  return usedKeys;
}

/**
 * Sugiere combinaciones de teclas alternativas
 */
export function suggestAlternativeKeys(
  baseKeys: string,
  keybindings: Map<string, KeybindingEntry>
): string[] {
  const suggestions: string[] = [];
  const modifiers = ['ctrl', 'alt', 'shift'];

  // Intentar agregar modificadores
  for (const mod of modifiers) {
    const suggestion = `${mod}+${baseKeys}`;
    if (!hasKeyCombination(suggestion, keybindings)) {
      suggestions.push(suggestion);
    }
  }

  // Intentar con combinaciones dobles
  for (let i = 0; i < modifiers.length; i++) {
    for (let j = i + 1; j < modifiers.length; j++) {
      const suggestion = `${modifiers[i]}+${modifiers[j]}+${baseKeys}`;
      if (!hasKeyCombination(suggestion, keybindings)) {
        suggestions.push(suggestion);
      }
    }
  }

  return suggestions.slice(0, 3); // Limitar a 3 sugerencias
}

/**
 * Verifica si una combinación de teclas ya existe
 */
function hasKeyCombination(
  keys: string,
  keybindings: Map<string, KeybindingEntry>
): boolean {
  for (const entry of keybindings.values()) {
    if (areKeysEqual(entry.keys, keys)) {
      return true;
    }
  }
  return false;
}
