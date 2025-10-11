import { getKeysSync, subscribeToKeybindingsChanges } from '@/services/keybindingsService';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import keyBindings from './global.keys';

interface BasicFormKeybindingOptions {
  toggleSidebar?: () => void;
}

export const useTabBarKeybindings = (options: BasicFormKeybindingOptions = {}) => {
  const { toggleSidebar } = options; //recibes la acción callback

  const formRef = useRef<HTMLFormElement>(null);

  // Estado reactivo para las teclas (se actualiza cuando cambian)
  const [toggleSidebarKeys, setToggleSidebarKeys] = useState(() => getKeysSync('actions.sidebar') || keyBindings.tabs.previous.keys);

  // Suscribirse a cambios en keybindings
  useEffect(() => {
    const unsubscribe = subscribeToKeybindingsChanges(() => {
      const newToggleSidebarKeys = getKeysSync('actions.sidebar') || keyBindings.actions.sidebar.keys;

      setToggleSidebarKeys(newToggleSidebarKeys);
    });

    return unsubscribe;
  }, []);

  useHotkeys(toggleSidebarKeys, (e) => {
    e.preventDefault();
    if (toggleSidebar) {
      toggleSidebar();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!toggleSidebar
  }, [toggleSidebarKeys, toggleSidebar]);

  return {
    formRef
  };
};
