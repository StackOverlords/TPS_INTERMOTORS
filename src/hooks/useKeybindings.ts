import { useEffect, useState } from 'react';
import { loadKeybindings, type LoadedKeybinding } from '@/services/keybindingsService';

/**
 * Hook para acceder a los keybindings cargados desde la DB
 * Se actualiza automáticamente cuando cambian
 */
export const useKeybindings = () => {
  const [keybindings, setKeybindings] = useState<Map<string, LoadedKeybinding>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadBindings = async () => {
    try {
      setLoading(true);
      const bindings = await loadKeybindings();
      setKeybindings(bindings);
    } catch (error) {
      console.error('Error loading keybindings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBindings();
  }, []);

  /**
   * Obtiene las teclas para un keybinding específico
   */
  const getKeys = (id: string): string | undefined => {
    return keybindings.get(id)?.keys;
  };

  /**
   * Obtiene todas las teclas de una categoría
   */
  const getByCategory = (category: string): LoadedKeybinding[] => {
    return Array.from(keybindings.values()).filter(kb => kb.category === category);
  };

  /**
   * Refresca los keybindings desde la DB
   * Útil después de guardar cambios
   */
  const refresh = async () => {
    await loadBindings();
  };

  return {
    keybindings,
    loading,
    getKeys,
    getByCategory,
    refresh,
  };
};
