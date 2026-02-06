import { Store } from "@tauri-apps/plugin-store";
import type { StateStorage } from "zustand/middleware";

class TauriStorageAdapter implements StateStorage {
  private store: Store | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private storeName: string;

  constructor(storeName = 'app-storage.json') {
    this.storeName = storeName;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized && this.store) {
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.initialize();
    await this.initPromise;
    this.initPromise = null;
  }

  private async initialize(): Promise<void> {
    try {
      this.store = await Store.load(this.storeName, {
        autoSave: false,
        defaults: {}
      })
      this.initialized = true; // INicializamos
    } catch (error) {
      console.log('Error initilizing Tauri Store: ', error);
      throw error;
    }
  }

  async getItem(name: string): Promise<string | null> {
    await this.ensureInitialized();
    if (!this.store) return null;

    try {
      const value = await this.store.get<string>(name);
      return value ?? null;
    } catch (error) {
      console.log(`Error getting item ${name}:`, error);
      return null;
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.store) throw new Error('Store not initialized');

    try {
      await this.store.set(name, value);
      await this.store.save();
    } catch (error) {
      console.log(`Error setting item ${name}:`, error);
      throw error;
    }
  }

  async removeItem(name: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.store) throw new Error('Store not initialized');

    try {
      await this.store.delete(name);
      await this.store.save();
    } catch (error) {
      console.log(`Error removing item ${name}:`, error);
      throw error;
    }
  }
}

//instancia para las apariencias y temas
export const tauriAppearanceStorage = new TauriStorageAdapter('appearance-storage.json'); 
export const tauriThemeStorage = new TauriStorageAdapter('theme-storage.json');

export const createTauriStorage = (storeName: string): StateStorage => {
  return new TauriStorageAdapter(storeName);
}
