import { getKeybindingsRepository } from '@/platform';
import type { KeybindingRecord } from '@/platform/ports/keybindingsRepository';

/**
 * Forma de una fila persistida. Vive en el puerto porque ya no es un detalle
 * del esquema SQLite: el target web guarda la misma estructura en clave/valor.
 */
export type KeybindingRow = KeybindingRecord;

// Formato mejorado para exportación/importación
export interface KeybindingExport {
  id: string;
  keys: string;
  default_keys: string;
  category: string;
  description: string;
}

export interface KeybindingsExportFile {
  version: string;
  exportDate: string;
  appVersion: string;
  totalKeybindings: number;
  keybindings: KeybindingExport[];
}

// Resultado de validación
export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: Array<{
    id: string;
    importedKeys: string;
    existingKeys: string;
    description: string;
  }>;
  summary: {
    total: number;
    new: number;
    modified: number;
    unchanged: number;
  };
}

// Opciones de importación
export type ImportMode = 'replace' | 'merge' | 'add-only';

export interface ImportOptions {
  mode: ImportMode;
  skipConflicts?: boolean;
}

//Guarda o actualiza un keybinding personalizado
export const saveKeybinding = async (
  id: string,
  keys: string,
  defaultKeys: string = keys
): Promise<void> => {
  await getKeybindingsRepository().upsert(id, keys, defaultKeys);
};


//Obtiene un keybinding por ID
export const getKeybinding = async (
  id: string
): Promise<KeybindingRow | null> => {
  return getKeybindingsRepository().getById(id);
};


//Obtiene todos los keybindings personalizados
export const getAllKeybindings = async (): Promise<KeybindingRow[]> => {
  return getKeybindingsRepository().getEnabled();
};

//Elimina un keybinding personalizado (vuelve al default)
export const deleteKeybinding = async (id: string): Promise<void> => {
  await getKeybindingsRepository().remove(id);
};


//Habilita o deshabilita un keybinding
export const toggleKeybinding = async (
  id: string,
  enabled: boolean
): Promise<void> => {
  await getKeybindingsRepository().setEnabled(id, enabled);
};


//Elimina todos los keybindings personalizados
export const resetAllKeybindings = async (): Promise<void> => {
  await getKeybindingsRepository().clear();
};

//Exporta todos los keybindings a JSON con formato mejorado
export const exportKeybindings = async (): Promise<string> => {
  // Importar dinámicamente para evitar dependencias circulares
  const { default: keyBindings } = await import('@/hooks/keyBindings/global.keys');
  const customBindings = await getAllKeybindings();

  // Crear mapa de keybindings personalizados
  const customMap = new Map(customBindings.map(kb => [kb.id, kb]));

  // Construir array completo con metadatos
  const keybindingsExport: KeybindingExport[] = [];

  for (const [category, bindings] of Object.entries(keyBindings)) {
    for (const [action, config] of Object.entries(bindings)) {
      const id = `${category}.${action}`;
      const custom = customMap.get(id);

      keybindingsExport.push({
        id,
        keys: custom?.keys || config.keys,
        default_keys: config.keys,
        category,
        description: config.description,
      });
    }
  }

  // Obtener versión de la app
  let appVersion = '1.0.0';
  try {
    const packageJson = await import('../../../package.json');
    appVersion = packageJson.default?.version || packageJson.version || '1.0.0';
  } catch (error) {
    // Fallback si no se puede leer package.json
    console.warn('No se pudo leer package.json:', error);
  }

  const exportFile: KeybindingsExportFile = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    appVersion,
    totalKeybindings: keybindingsExport.length,
    keybindings: keybindingsExport,
  };

  return JSON.stringify(exportFile, null, 2);
};

//Valida un archivo de importación sin aplicar cambios
export const validateImportFile = async (
  jsonData: string
): Promise<ImportValidationResult> => {
  const result: ImportValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    conflicts: [],
    summary: {
      total: 0,
      new: 0,
      modified: 0,
      unchanged: 0,
    },
  };

  try {
    // Parse JSON
    const data = JSON.parse(jsonData);

    // Validar estructura básica
    if (!data.version) {
      result.errors.push('Falta el campo "version" en el archivo');
      result.valid = false;
    }

    if (!data.keybindings || !Array.isArray(data.keybindings)) {
      result.errors.push('Falta el array "keybindings" o no es válido');
      result.valid = false;
      return result;
    }

    const importFile = data as KeybindingsExportFile;

    // Validar versión (en el futuro podemos manejar migraciones)
    if (importFile.version !== '1.0.0') {
      result.warnings.push(`Versión del archivo (${importFile.version}) diferente a la esperada (1.0.0)`);
    }

    // Importar defaults para validación
    const { default: keyBindings } = await import('@/hooks/keyBindings/global.keys');
    const validIds = new Set<string>();

    for (const [category, bindings] of Object.entries(keyBindings)) {
      for (const action of Object.keys(bindings)) {
        validIds.add(`${category}.${action}`);
      }
    }

    // Obtener keybindings actuales
    const currentBindings = await getAllKeybindings();
    const currentMap = new Map(currentBindings.map(kb => [kb.id, kb]));

    result.summary.total = importFile.keybindings.length;

    // Validar cada keybinding
    const keysUsageMap = new Map<string, string[]>();

    for (const kb of importFile.keybindings) {
      // Validar campos requeridos
      if (!kb.id) {
        result.errors.push('Un keybinding no tiene ID');
        result.valid = false;
        continue;
      }

      if (!kb.keys) {
        result.errors.push(`El keybinding "${kb.id}" no tiene teclas definidas`);
        result.valid = false;
        continue;
      }

      // Validar que el ID existe en la app
      if (!validIds.has(kb.id)) {
        result.warnings.push(`El keybinding "${kb.id}" no existe en esta versión de la app`);
        continue;
      }

      // Determinar si es nuevo, modificado o sin cambios
      const current = currentMap.get(kb.id);
      if (!current) {
        result.summary.new++;
      } else if (current.keys !== kb.keys) {
        result.summary.modified++;
        result.conflicts.push({
          id: kb.id,
          importedKeys: kb.keys,
          existingKeys: current.keys,
          description: kb.description || kb.id,
        });
      } else {
        result.summary.unchanged++;
      }

      // Detectar conflictos de teclas
      const existing = keysUsageMap.get(kb.keys) || [];
      existing.push(kb.id);
      keysUsageMap.set(kb.keys, existing);
    }

    // Advertir sobre combinaciones duplicadas
    for (const [keys, ids] of keysUsageMap.entries()) {
      if (ids.length > 1) {
        result.warnings.push(
          `Las teclas "${keys}" están asignadas a múltiples acciones: ${ids.join(', ')}`
        );
      }
    }

  } catch (error) {
    result.valid = false;
    result.errors.push(
      error instanceof Error
        ? `Error al procesar el archivo: ${error.message}`
        : 'Error desconocido al procesar el archivo'
    );
  }

  return result;
};

//Importa keybindings desde JSON con opciones
export const importKeybindings = async (
  jsonData: string,
  options: ImportOptions = { mode: 'merge' }
): Promise<void> => {
  // Primero validar
  const validation = await validateImportFile(jsonData);

  if (!validation.valid) {
    throw new Error(`Archivo inválido: ${validation.errors.join(', ')}`);
  }

  const importFile = JSON.parse(jsonData) as KeybindingsExportFile;

  // Si es modo replace, limpiar todo primero
  if (options.mode === 'replace') {
    await resetAllKeybindings();
  }

  // Obtener keybindings actuales para modo add-only
  let currentIds = new Set<string>();
  if (options.mode === 'add-only') {
    const current = await getAllKeybindings();
    currentIds = new Set(current.map(kb => kb.id));
  }

  // Importar cada keybinding
  for (const kb of importFile.keybindings) {
    // En modo add-only, saltar si ya existe
    if (options.mode === 'add-only' && currentIds.has(kb.id)) {
      continue;
    }

    // Saltar conflictos si la opción está activada
    if (options.skipConflicts) {
      const conflict = validation.conflicts.find(c => c.id === kb.id);
      if (conflict) continue;
    }

    await saveKeybinding(kb.id, kb.keys, kb.default_keys);
  }
};
