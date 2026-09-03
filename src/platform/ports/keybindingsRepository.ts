/**
 * Puerto: persistencia de atajos de teclado personalizados.
 *
 * ── Por qué el puerto está a nivel de DOMINIO y no de SQL ────────────────────
 * El resto de los puertos abstrae una capacidad que ambos targets tienen con
 * APIs distintas. SQLite es diferente: el navegador NO tiene motor SQL, y
 * llevarlo (sql.js / wa-sqlite) cuesta ~1 MB de WASM para persistir un puñado
 * de atajos. Un `SqlPort` sería una abstracción falsa: no se puede implementar.
 *
 * La frontera correcta es la operación de negocio. En escritorio la respalda la
 * tabla `keybindings` de SQLite —intacta, sin migrar datos de usuarios que ya
 * tienen atajos guardados—; en web, el puerto de clave/valor.
 *
 * Regla general: cuando los targets difieren en CAPACIDAD y no solo en API, el
 * puerto va donde está la intención, no donde está la tecnología.
 */

/** Fila persistida. Los nombres siguen el esquema SQLite ya existente. */
export interface KeybindingRecord {
  id: string;
  keys: string;
  default_keys: string;
  /** SQLite no tiene boolean: 0 o 1. */
  enabled: number;
  source: 'user' | 'default';
  /** Epoch en segundos. */
  updated_at: number;
}

export interface KeybindingsRepositoryPort {
  /** Atajos habilitados (`enabled = 1`), ordenados por id. */
  getEnabled(): Promise<KeybindingRecord[]>;
  /** Todos los atajos guardados, habilitados o no. */
  getAll(): Promise<KeybindingRecord[]>;
  getById(id: string): Promise<KeybindingRecord | null>;
  /** Inserta o reemplaza. Marca `source: 'user'` y actualiza `updated_at`. */
  upsert(id: string, keys: string, defaultKeys: string): Promise<void>;
  setEnabled(id: string, enabled: boolean): Promise<void>;
  remove(id: string): Promise<void>;
  /** Borra todas las personalizaciones (vuelta a los valores por defecto). */
  clear(): Promise<void>;
}
