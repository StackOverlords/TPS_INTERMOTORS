/**
 * Puerto: preferencias de usuario persistidas.
 *
 * Misma decisión de frontera que `keybindingsRepository`: el puerto está a nivel
 * de dominio porque el navegador no tiene SQLite. En escritorio lo respalda la
 * tabla `user_preferences` ya existente (sin migrar datos); en web, el puerto de
 * clave/valor.
 *
 * El valor se guarda con su tipo para poder devolverlo deserializado: SQLite
 * solo almacena texto, así que la columna `type` dice cómo reconstruirlo.
 */

export type PreferenceType = 'string' | 'json' | 'number' | 'boolean';

export interface PreferenceRecord {
  key: string;
  /** Siempre serializado a texto. `type` indica cómo interpretarlo. */
  value: string;
  type: PreferenceType;
  /** Epoch en segundos. */
  updated_at: number;
}

export interface PreferencesRepositoryPort {
  get(key: string): Promise<PreferenceRecord | null>;
  getAll(): Promise<PreferenceRecord[]>;
  set(key: string, value: string, type: PreferenceType): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
