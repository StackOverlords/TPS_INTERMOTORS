/**
 * Puerto: almacenamiento clave/valor persistente.
 *
 * Modela un "store con nombre" (un archivo JSON en escritorio, un espacio de
 * claves con prefijo en el navegador). Cada store está aislado del resto y
 * sobrevive al reinicio de la app.
 *
 * Es el reemplazo de los usos directos de `@tauri-apps/plugin-store`.
 */

export interface KeyValueStoreOptions {
  /**
   * Escribe a disco en cada mutación. Con `false` hay que llamar a `save()`.
   * En el target web las escrituras siempre son inmediatas y `save()` es no-op.
   */
  autoSave?: boolean;
  /** Valores iniciales si el store todavía no existe. */
  defaults?: Record<string, unknown>;
}

export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  /** `true` si la clave existía. */
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  entries<T>(): Promise<[string, T][]>;
  /** Fuerza la persistencia. No-op donde la escritura ya es inmediata. */
  save(): Promise<void>;
}

export interface KeyValueStorePort {
  /**
   * Abre (o crea) un store por nombre. Llamarlo dos veces con el mismo nombre
   * devuelve la MISMA instancia: los adaptadores cachean por `storeName`.
   */
  open(
    storeName: string,
    options?: KeyValueStoreOptions,
  ): Promise<KeyValueStore>;
}
