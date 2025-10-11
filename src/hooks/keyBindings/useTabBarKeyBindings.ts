import { getKeysSync, subscribeToKeybindingsChanges } from '@/services/keybindingsService';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import keyBindings from './global.keys';

interface BasicFormKeybindingOptions {
  previousTab?: () => void;
  nextTab?: () => void;
  closeCurrentTab?: () => void;
  canCloseCurrentTab?: boolean; // Nueva propiedad para controlar si se puede cerrar
}

export const useTabBarKeybindings = (options: BasicFormKeybindingOptions = {}) => {
  const { previousTab, nextTab, closeCurrentTab, canCloseCurrentTab = true } = options;
  const formRef = useRef<HTMLFormElement>(null);

  // Estado reactivo para las teclas (se actualiza cuando cambian)
  const [previousTabKeys, setPreviousTabKeys] = useState(() => getKeysSync('tabs.previous') || keyBindings.tabs.previous.keys);
  const [nextTabKeys, setNextTabKeys] = useState(() => getKeysSync('tabs.next') || keyBindings.tabs.next.keys);
  const [closeCurrentTabKeys, setCloseCurrentTabKeys] = useState(() => getKeysSync('tabs.closeCurrent') || keyBindings.tabs.closeCurrent.keys);

  // Suscribirse a cambios en keybindings
  useEffect(() => {
    const unsubscribe = subscribeToKeybindingsChanges(() => {
      const newPreviousTabKeys = getKeysSync('tabs.previous') || keyBindings.tabs.previous.keys;
      const newNextTabKeys = getKeysSync('tabs.next') || keyBindings.tabs.next.keys;
      const newCloseCurrentTabKeys = getKeysSync('tabs.closeCurrent') || keyBindings.tabs.closeCurrent.keys;

      setPreviousTabKeys(newPreviousTabKeys);
      setNextTabKeys(newNextTabKeys);
      setCloseCurrentTabKeys(newCloseCurrentTabKeys);
    });

    return unsubscribe;
  }, []);

  useHotkeys(previousTabKeys, (e) => {
    e.preventDefault();
    if (previousTab) {
      previousTab();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!previousTab
  }, [previousTabKeys, previousTab]) // Agregar previousTabKeys como dependencia

  useHotkeys(nextTabKeys, (e) => {
    e.preventDefault();
    if (nextTab) {
      nextTab();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!nextTab
  }, [nextTabKeys, nextTab]) // Agregar nextTabKeys como dependencia

  useHotkeys(closeCurrentTabKeys, (e) => {
    e.preventDefault();
    if (closeCurrentTab && canCloseCurrentTab) {
      closeCurrentTab();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!closeCurrentTab && canCloseCurrentTab // Deshabilitar si no se puede cerrar
  }, [closeCurrentTabKeys, closeCurrentTab, canCloseCurrentTab]) // Agregar canCloseCurrentTab como dependencia
 
  return {
    formRef
  };
};
