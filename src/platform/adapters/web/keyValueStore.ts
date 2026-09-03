/**
 * Adaptador web del puerto `KeyValueStorePort`.
 *
 * Cada store ocupa un espacio de claves propio dentro de `localStorage`, con el
 * prefijo `tps:<storeName>:`. Eso replica el aislamiento que en escritorio dan
 * los archivos JSON separados, y se comparte entre la ventana principal y las
 * secundarias por ser el mismo origen — igual que el store de Tauri.
 *
 * Límites conocidos (aceptables para los stores actuales: tema, apariencia,
 * configuración de vistas y cola offline):
 *  - `localStorage` ronda los 5 MB por origen. Si algún store crece —la cola
 *    offline es la candidata— la migración natural es IndexedDB detrás de este
 *    MISMO puerto, sin tocar a los consumidores.
 *  - Es síncrono: escrituras muy grandes bloquean el hilo principal.
 *  - En modo privado o con cookies bloqueadas puede lanzar al escribir; por eso
 *    toda operación va envuelta y degrada a un fallback en memoria.
 */

import type {
  KeyValueStore,
  KeyValueStoreOptions,
  KeyValueStorePort,
} from '@/platform/ports/keyValueStore';

const NAMESPACE = 'tps';

const cache = new Map<string, Promise<KeyValueStore>>();

/**
 * Respaldo en memoria para cuando `localStorage` no está disponible (navegación
 * privada, almacenamiento bloqueado). La app sigue funcionando; se pierde la
 * persistencia entre sesiones, que es preferible a romper el arranque.
 */
const memoryFallback = new Map<string, string>();
let useMemoryFallback = false;

function detectStorage(): void {
  try {
    const probe = `${NAMESPACE}:__probe__`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    useMemoryFallback = false;
  } catch {
    console.warn(
      '[WebStore] localStorage no disponible; se usa un respaldo en memoria (no persiste entre sesiones).',
    );
    useMemoryFallback = true;
  }
}

detectStorage();

function readRaw(fullKey: string): string | null {
  if (useMemoryFallback) return memoryFallback.get(fullKey) ?? null;
  try {
    return window.localStorage.getItem(fullKey);
  } catch {
    return memoryFallback.get(fullKey) ?? null;
  }
}

function writeRaw(fullKey: string, value: string): void {
  if (useMemoryFallback) {
    memoryFallback.set(fullKey, value);
    return;
  }
  try {
    window.localStorage.setItem(fullKey, value);
  } catch (error) {
    // Cuota excedida o almacenamiento bloqueado: no perdemos el dato en la
    // sesión actual, pero avisamos porque no va a sobrevivir al reinicio.
    console.error(`[WebStore] No se pudo persistir "${fullKey}":`, error);
    memoryFallback.set(fullKey, value);
  }
}

function removeRaw(fullKey: string): void {
  memoryFallback.delete(fullKey);
  if (useMemoryFallback) return;
  try {
    window.localStorage.removeItem(fullKey);
  } catch {
    // Ya lo quitamos del respaldo en memoria; nada más que hacer.
  }
}

function listKeys(prefix: string): string[] {
  const keys = new Set<string>();

  for (const key of memoryFallback.keys()) {
    if (key.startsWith(prefix)) keys.add(key);
  }

  if (!useMemoryFallback) {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(prefix)) keys.add(key);
      }
    } catch {
      // Nos quedamos con lo que haya en memoria.
    }
  }

  return [...keys];
}

function createStore(
  storeName: string,
  options: KeyValueStoreOptions,
): KeyValueStore {
  const prefix = `${NAMESPACE}:${storeName}:`;
  const fullKey = (key: string) => `${prefix}${key}`;

  // Los `defaults` solo aplican a claves que todavía no existen, igual que en
  // el plugin de Tauri: nunca pisan lo que el usuario ya guardó.
  for (const [key, value] of Object.entries(options.defaults ?? {})) {
    if (readRaw(fullKey(key)) === null) {
      writeRaw(fullKey(key), JSON.stringify(value));
    }
  }

  return {
    async get<T>(key: string): Promise<T | null> {
      const raw = readRaw(fullKey(key));
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch (error) {
        console.error(
          `[WebStore] Valor corrupto en "${storeName}:${key}", se descarta:`,
          error,
        );
        removeRaw(fullKey(key));
        return null;
      }
    },

    async set<T>(key: string, value: T): Promise<void> {
      writeRaw(fullKey(key), JSON.stringify(value));
    },

    async delete(key: string): Promise<boolean> {
      const existed = readRaw(fullKey(key)) !== null;
      removeRaw(fullKey(key));
      return existed;
    },

    async clear(): Promise<void> {
      for (const key of listKeys(prefix)) removeRaw(key);
    },

    async entries<T>(): Promise<[string, T][]> {
      const result: [string, T][] = [];

      for (const key of listKeys(prefix)) {
        const raw = readRaw(key);
        if (raw === null) continue;
        try {
          result.push([key.slice(prefix.length), JSON.parse(raw) as T]);
        } catch {
          // Entrada corrupta: se ignora en el listado.
        }
      }

      return result;
    },

    async save(): Promise<void> {
      // No-op: `localStorage` ya escribió de forma síncrona en cada `set`.
    },
  };
}

export const webKeyValueStore: KeyValueStorePort = {
  open(storeName, options = {}) {
    let pending = cache.get(storeName);
    if (!pending) {
      pending = Promise.resolve(createStore(storeName, options));
      cache.set(storeName, pending);
    }
    return pending;
  },
};
