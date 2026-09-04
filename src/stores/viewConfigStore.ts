import type { ViewConfiguration, TableState, TableConfig } from '@/view-configs/viewConfigTypes';
import { getKeyValueStore, type KeyValueStore } from '@/platform';

class ViewConfigStore {
  private store: KeyValueStore | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized() {
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

  private async initialize() {
    try {
      this.store = await getKeyValueStore().open('view-configs.json', {
        autoSave: false,
        defaults: {},
      });
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing store:', error);
      throw error;
    }
  }

  private getUserKey(viewId: string, userId: string): string {
    return `user:${userId}:${viewId}`;
  }

  /**
   * Obtener configuración de usuario para una vista
   */
  async getUserConfig(
    viewId: string, 
    userId: string
  ): Promise<Partial<ViewConfiguration> | null> {
    await this.ensureInitialized();
    if (!this.store) return null;

    try {
      const key = this.getUserKey(viewId, userId);
      const config = await this.store.get<Partial<ViewConfiguration>>(key);
      return config || null;
    } catch (error) {
      console.error('Error getting user config:', error);
      return null;
    }
  }

  /**
   * Guardar configuración de usuario para una vista
   */
  async setUserConfig(
    viewId: string,
    userId: string,
    config: Partial<ViewConfiguration>
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.store) throw new Error('Store not initialized');

    try {
      const key = this.getUserKey(viewId, userId);
      await this.store.set(key, {
        ...config,
        _updatedAt: new Date().toISOString(),
      });
      await this.store.save();

      window.dispatchEvent(
        new CustomEvent('view-config:updated', {
          detail: { viewId, userId, level: 'user' },
        })
      );
    } catch (error) {
      console.error('Error setting user config:', error);
      throw error;
    }
  }

  /**
   * ✅ Actualizar solo la configuración de tabla (behaviors + state)
   */
  async updateTableConfig(
    viewId: string,
    userId: string,
    tableConfig: Partial<TableConfig>
  ): Promise<void> {
    const currentConfig = await this.getUserConfig(viewId, userId);
    
    await this.setUserConfig(viewId, userId, {
      ...currentConfig,
      table: {
        behaviors: {
          ...currentConfig?.table?.behaviors,
          ...tableConfig.behaviors,
        },
        state: {
          ...currentConfig?.table?.state,
          ...tableConfig.state,
          _updatedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * ✅ Actualizar solo el estado de la tabla (table.state)
   */
  async updateTableState(
    viewId: string,
    userId: string,
    tableState: Partial<TableState>
  ): Promise<void> {
    const currentConfig = await this.getUserConfig(viewId, userId);
    
    await this.setUserConfig(viewId, userId, {
      ...currentConfig,
      table: {
        ...currentConfig?.table,
        state: {
          ...currentConfig?.table?.state,
          ...tableState,
          _updatedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * ✅ Obtener solo el estado de la tabla
   */
  async getTableState(
    viewId: string,
    userId: string
  ): Promise<TableState | null> {
    const config = await this.getUserConfig(viewId, userId);
    return config?.table?.state || null;
  }

  /**
   * ✅ Resetear solo el estado de la tabla
   */
  async resetTableState(
    viewId: string,
    userId: string
  ): Promise<void> {
    const currentConfig = await this.getUserConfig(viewId, userId);
    
    await this.setUserConfig(viewId, userId, {
      ...currentConfig,
      table: {
        ...currentConfig?.table,
        state: undefined,
      },
    });
  }

  /**
   * Actualizar solo features de una vista
   */
  async updateFeatures(
    viewId: string,
    userId: string,
    features: Partial<ViewConfiguration['features']>
  ): Promise<void> {
    const currentConfig = await this.getUserConfig(viewId, userId);
    
    await this.setUserConfig(viewId, userId, {
      ...currentConfig,
      features: {
        ...currentConfig?.features,
        ...features,
      },
    });
  }

  /**
   * Actualizar solo behaviors de una vista (NO incluye table.behaviors)
   */
  async updateBehaviors(
    viewId: string,
    userId: string,
    behaviors: Partial<ViewConfiguration['behaviors']>
  ): Promise<void> {
    const currentConfig = await this.getUserConfig(viewId, userId);
    
    await this.setUserConfig(viewId, userId, {
      ...currentConfig,
      behaviors: {
        ...currentConfig?.behaviors,
        ...behaviors,
      },
    });
  }

  /**
   * Eliminar configuración de usuario para una vista
   */
  async deleteUserConfig(viewId: string, userId: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.store) throw new Error('Store not initialized');

    try {
      const key = this.getUserKey(viewId, userId);
      await this.store.delete(key);
      await this.store.save();

      window.dispatchEvent(
        new CustomEvent('view-config:updated', {
          detail: { viewId, userId, level: 'user' },
        })
      );
    } catch (error) {
      console.error('Error deleting user config:', error);
      throw error;
    }
  }

  /**
   * Limpiar todas las configuraciones de un usuario
   */
  async clearAllUserConfigs(userId: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.store) throw new Error('Store not initialized');

    try {
      const entries = await this.store.entries<Partial<ViewConfiguration>>();
      const userPrefix = `user:${userId}:`;

      for (const [key] of entries) {
        if (typeof key === 'string' && key.startsWith(userPrefix)) {
          await this.store.delete(key);
        }
      }

      await this.store.save();

      window.dispatchEvent(
        new CustomEvent('view-config:updated', {
          detail: { userId, level: 'user', action: 'clear-all' },
        })
      );
    } catch (error) {
      console.error('Error clearing all user configs:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las configuraciones de un usuario
   */
  async getAllUserConfigs(
    userId: string
  ): Promise<Record<string, Partial<ViewConfiguration>>> {
    await this.ensureInitialized();
    if (!this.store) return {};

    try {
      const entries = await this.store.entries<Partial<ViewConfiguration>>();
      const userPrefix = `user:${userId}:`;
      const configs: Record<string, Partial<ViewConfiguration>> = {};

      for (const [key, value] of entries) {
        if (typeof key === 'string' && key.startsWith(userPrefix)) {
          const viewId = key.replace(userPrefix, '');
          configs[viewId] = value;
        }
      }

      return configs;
    } catch (error) {
      console.error('Error getting all user configs:', error);
      return {};
    }
  }

  /**
   * Exportar configuraciones de un usuario (para backup)
   */
  async exportUserConfigs(userId: string): Promise<string> {
    const configs = await this.getAllUserConfigs(userId);
    return JSON.stringify(
      {
        userId,
        exportDate: new Date().toISOString(),
        configs,
      },
      null,
      2
    );
  }

  /**
   * Importar configuraciones de un usuario (desde backup)
   */
  async importUserConfigs(userId: string, jsonData: string): Promise<void> {
    try {
      const imported = JSON.parse(jsonData);
      
      if (imported.configs) {
        for (const [viewId, config] of Object.entries(imported.configs)) {
          await this.setUserConfig(
            viewId, 
            userId, 
            config as Partial<ViewConfiguration>
          );
        }
      }

      window.dispatchEvent(
        new CustomEvent('view-configs:imported', {
          detail: { userId },
        })
      );
    } catch (error) {
      console.error('Error importing user configs:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de configuraciones
   */
  async getStats(userId: string) {
    const configs = await this.getAllUserConfigs(userId);
    const configCount = Object.keys(configs).length;
    
    const jsonString = JSON.stringify(configs);
    const totalSize = new Blob([jsonString]).size;

    return {
      totalViews: configCount,
      sizeInBytes: totalSize,
      sizeInKB: (totalSize / 1024).toFixed(2),
      lastModified: Object.values(configs)
        .map((c: any) => c._updatedAt)
        .filter(Boolean)
        .sort()
        .reverse()[0] || null,
    };
  }

  /**
   * Resetear el store (útil para testing o debugging)
   */
  async reset(): Promise<void> {
    if (this.store) {
      await this.store.clear();
      await this.store.save();
      this.initialized = false;
      this.store = null;
    }
  }
}

export const viewConfigStore = new ViewConfigStore();
export default viewConfigStore;