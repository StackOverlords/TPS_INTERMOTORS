/**
 * Adaptador Tauri del puerto `KeyValueStorePort`.
 *
 * Cada store es un archivo JSON en el directorio de datos de la app, manejado
 * por `@tauri-apps/plugin-store`.
 */

import { Store } from '@tauri-apps/plugin-store';

import type {
  KeyValueStore,
  KeyValueStoreOptions,
  KeyValueStorePort,
} from '@/platform/ports/keyValueStore';

/** Una instancia por nombre de store: abrir dos veces el mismo archivo duplica estado. */
const cache = new Map<string, Promise<KeyValueStore>>();

async function openStore(
  storeName: string,
  options: KeyValueStoreOptions,
): Promise<KeyValueStore> {
  const store = await Store.load(storeName, {
    autoSave: options.autoSave ?? false,
    defaults: options.defaults ?? {},
  });

  return {
    async get<T>(key: string): Promise<T | null> {
      return (await store.get<T>(key)) ?? null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      await store.set(key, value);
    },
    async delete(key: string): Promise<boolean> {
      return store.delete(key);
    },
    async clear(): Promise<void> {
      await store.clear();
    },
    async entries<T>(): Promise<[string, T][]> {
      return store.entries<T>();
    },
    async save(): Promise<void> {
      await store.save();
    },
  };
}

export const tauriKeyValueStore: KeyValueStorePort = {
  open(storeName, options = {}) {
    let pending = cache.get(storeName);
    if (!pending) {
      pending = openStore(storeName, options).catch((error) => {
        // No dejamos una promesa rechazada en el cache: el próximo intento
        // debe poder reabrir el store en vez de heredar el fallo para siempre.
        cache.delete(storeName);
        throw error;
      });
      cache.set(storeName, pending);
    }
    return pending;
  },
};
