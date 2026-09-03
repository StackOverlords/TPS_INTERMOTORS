import { getKeyValueStore, type KeyValueStore } from '@/platform';
import type { StateStorage } from 'zustand/middleware';

/**
 * Puente entre el middleware `persist` de zustand y el puerto de almacenamiento.
 *
 * Zustand serializa el estado a string y espera un `StateStorage`; el puerto
 * guarda ese string bajo la clave que le pasa zustand. Quién escribe realmente
 * —un JSON en disco o `localStorage`— lo decide el adaptador activo.
 *
 * Reemplaza al viejo `tauriPluginAdapterStore`, que hablaba con
 * `@tauri-apps/plugin-store` directo.
 */
class PlatformStateStorage implements StateStorage {
  private store: Promise<KeyValueStore> | null = null;
  private readonly storeName: string;

  // Campo explícito en vez de propiedad de parámetro: `erasableSyntaxOnly`
  // (tsconfig.app.json) prohíbe la sintaxis que TypeScript debe transformar.
  constructor(storeName: string) {
    this.storeName = storeName;
  }

  private getStore(): Promise<KeyValueStore> {
    // El puerto ya cachea por nombre; guardamos la promesa para no re-entrar.
    this.store ??= getKeyValueStore().open(this.storeName, {
      autoSave: false,
      defaults: {},
    });
    return this.store;
  }

  async getItem(name: string): Promise<string | null> {
    try {
      const store = await this.getStore();
      return await store.get<string>(name);
    } catch (error) {
      console.error(`[PlatformStateStorage] Error leyendo "${name}":`, error);
      return null;
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    try {
      const store = await this.getStore();
      await store.set(name, value);
      await store.save();
    } catch (error) {
      console.error(`[PlatformStateStorage] Error guardando "${name}":`, error);
      throw error;
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      const store = await this.getStore();
      await store.delete(name);
      await store.save();
    } catch (error) {
      console.error(`[PlatformStateStorage] Error borrando "${name}":`, error);
      throw error;
    }
  }
}

export const appearanceStorage: StateStorage = new PlatformStateStorage(
  'appearance-storage.json',
);

export const themeStorage: StateStorage = new PlatformStateStorage(
  'theme-storage.json',
);

export const createPlatformStorage = (storeName: string): StateStorage =>
  new PlatformStateStorage(storeName);
