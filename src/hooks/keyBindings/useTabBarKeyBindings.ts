import { getKeysSync, subscribeToKeybindingsChanges } from '@/services/keybindingsService';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import keyBindings from './global.keys';

interface BasicFormKeybindingOptions {
  previousTab?: () => void;
  nextTab?: () => void;
  closeCurrentTab?: () => void;
}

export const useTabBarKeybindings = (options: BasicFormKeybindingOptions = {}) => {
  const { previousTab, nextTab, closeCurrentTab } = options;
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
    console.log('⏮️ Previous Tab hotkey presionado:', previousTabKeys);
    e.preventDefault();
    if (previousTab) {
      previousTab();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!previousTab
  }, [previousTabKeys, previousTab]) // Agregar previousTabKeys como dependencia

  useHotkeys(nextTabKeys, (e) => {
    console.log('⏭️ Next Tab hotkey presionado:', nextTabKeys);
    e.preventDefault();
    if (nextTab) {
      nextTab();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!nextTab
  }, [nextTabKeys, nextTab]) // Agregar nextTabKeys como dependencia

  useHotkeys(closeCurrentTabKeys, (e) => {
    console.log('❌ Close Current Tab hotkey presionado:', closeCurrentTabKeys);
    e.preventDefault();
    if (closeCurrentTab) {
      closeCurrentTab();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!closeCurrentTab
  }, [closeCurrentTabKeys, closeCurrentTab]) // Agregar closeCurrentTabKeys como dependencia
 
  return {
    formRef
  };
};
