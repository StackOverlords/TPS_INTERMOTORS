/**
 * Adapter para persistencia de keybindings.
 *
 * El almacenamiento concreto lo resuelve el puerto: tabla SQLite en escritorio,
 * clave/valor en web (ver platform/ports/keybindingsRepository.ts).
 */

import { getKeybindingsRepository } from '@/platform';
import { COMMANDS, type CommandId } from '../core/commands';
import type { KeybindingEntry, ImportMode } from '../core/types';

/**
 * Carga todos los keybindings desde la DB y los mergea con los defaults
 */
export async function loadAllKeybindings(): Promise<Map<string, KeybindingEntry>> {
  try {
    // Obtener keybindings personalizados desde la DB
    const customBindings = await getKeybindingsRepository().getEnabled();

    // Crear mapa de customizaciones
    const customMap = new Map<string, string>();
    customBindings.forEach(kb => {
      customMap.set(kb.id, kb.keys);
    });

    // Mergear con defaults de COMMANDS
    const allKeybindings = new Map<string, KeybindingEntry>();

    for (const [id, command] of Object.entries(COMMANDS)) {
      const customKeys = customMap.get(id);

      allKeybindings.set(id, {
        id,
        keys: customKeys || command.defaultKeys,
        defaultKeys: command.defaultKeys,
        description: command.description,
        category: command.category || 'general',
        isCustom: !!customKeys,
        when: command.when,
      });
    }

    return allKeybindings;
  } catch (error) {
    console.error('Error loading keybindings from DB:', error);
    // Fallback: retornar solo los defaults
    return getDefaultKeybindings();
  }
}

/**
 * Obtiene solo los keybindings por defecto (sin customizaciones)
 */
function getDefaultKeybindings(): Map<string, KeybindingEntry> {
  const defaults = new Map<string, KeybindingEntry>();

  for (const [id, command] of Object.entries(COMMANDS)) {
    defaults.set(id, {
      id,
      keys: command.defaultKeys,
      defaultKeys: command.defaultKeys,
      description: command.description,
      category: command.category || 'general',
      isCustom: false,
      when: command.when,
    });
  }

  return defaults;
}

/**
 * Guarda un keybinding personalizado en la DB
 */
export async function saveKeybinding(id: string, keys: string): Promise<void> {
  const command = COMMANDS[id as CommandId];
  if (!command) {
    throw new Error(`Command ID "${id}" does not exist`);
  }

  await getKeybindingsRepository().upsert(id, keys, command.defaultKeys);
}

/**
 * Elimina un keybinding personalizado (vuelve al default)
 */
export async function deleteKeybinding(id: string): Promise<void> {
  await getKeybindingsRepository().remove(id);
}

/**
 * Resetea todos los keybindings a sus valores por defecto
 */
export async function resetAllKeybindings(): Promise<void> {
  await getKeybindingsRepository().clear();
}

/**
 * Exporta todos los keybindings a JSON
 */
export async function exportKeybindings(keybindings: Map<string, KeybindingEntry>): Promise<string> {
  const exportData = {
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    appVersion: '1.0.0', // TODO: Obtener de package.json
    totalKeybindings: keybindings.size,
    keybindings: Array.from(keybindings.values()).map(kb => ({
      id: kb.id,
      keys: kb.keys,
      default_keys: kb.defaultKeys,
      category: kb.category,
      description: kb.description,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Valida un archivo de importación
 */
export async function validateImportFile(jsonData: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  keybindings: Array<{ id: string; keys: string }>;
}> {
  const result = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[],
    keybindings: [] as Array<{ id: string; keys: string }>,
  };

  try {
    const data = JSON.parse(jsonData);

    if (!data.version) {
      result.errors.push('Falta el campo "version" en el archivo');
      result.valid = false;
    }

    if (!data.keybindings || !Array.isArray(data.keybindings)) {
      result.errors.push('Falta el array "keybindings" o no es válido');
      result.valid = false;
      return result;
    }

    // Validar cada keybinding
    for (const kb of data.keybindings) {
      if (!kb.id || !kb.keys) {
        result.errors.push('Un keybinding no tiene ID o keys');
        result.valid = false;
        continue;
      }

      // Validar que el ID existe en COMMANDS
      if (!(kb.id in COMMANDS)) {
        result.warnings.push(`El keybinding "${kb.id}" no existe en esta versión`);
        continue;
      }

      result.keybindings.push({ id: kb.id, keys: kb.keys });
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(
      error instanceof Error
        ? `Error al procesar el archivo: ${error.message}`
        : 'Error desconocido'
    );
  }

  return result;
}

/**
 * Importa keybindings desde JSON
 */
export async function importKeybindings(
  jsonData: string,
  mode: ImportMode
): Promise<void> {
  const validation = await validateImportFile(jsonData);

  if (!validation.valid) {
    throw new Error(`Archivo inválido: ${validation.errors.join(', ')}`);
  }

  // Si es modo replace, limpiar todo primero
  if (mode === 'replace') {
    await resetAllKeybindings();
  }

  // Obtener IDs actuales para modo add-only
  let currentIds = new Set<string>();
  if (mode === 'add-only') {
    const current = await getKeybindingsRepository().getAll();
    currentIds = new Set(current.map(kb => kb.id));
  }

  // Importar cada keybinding
  for (const kb of validation.keybindings) {
    if (mode === 'add-only' && currentIds.has(kb.id)) {
      continue;
    }

    await saveKeybinding(kb.id, kb.keys);
  }
}
