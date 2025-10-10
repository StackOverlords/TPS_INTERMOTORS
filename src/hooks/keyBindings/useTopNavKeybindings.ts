import { getKeysSync, subscribeToKeybindingsChanges } from '@/services/keybindingsService';
import { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import keyBindings from './global.keys';

interface TopNavKeybindingOptions {
  onOpenCommandPalette?: () => void;
  onCloseCommandPalette?: () => void;
  onOpenCart?: () => void;
  onOpenNotifications?: () => void;
  onChangeBranch?: () => void;
  commandPaletteOpen?: boolean;
}

export const useTopNavKeybindings = (options: TopNavKeybindingOptions = {}) => {
  const {
    onOpenCommandPalette,
    onCloseCommandPalette,
    onOpenCart,
    onOpenNotifications,
    onChangeBranch,
    commandPaletteOpen = false
  } = options;


  //-------------------Vamos a tener en cuenta los keybindings personalizados-------------------//
  // Estado reactivo para las teclas
  const [commandPaletteKeys, setCommandPaletteKeys] = useState(() =>
    getKeysSync('actions.openCommandPalette') || keyBindings.actions.openCommandPalette.keys
  );
  const [closeModalKeys, setCloseModalKeys] = useState(() =>
    getKeysSync('actions.closeModal') || keyBindings.actions.closeModal.keys
  );
  const [cartKeys, setCartKeys] = useState(() =>
    getKeysSync('actions.openCart') || keyBindings.actions.openCart.keys
  );
  const [notificationsKeys, setNotificationsKeys] = useState(() =>
    getKeysSync('actions.openNotifications') || keyBindings.actions.openNotifications.keys
  );
  const [branchKeys, setBranchKeys] = useState(() =>
    getKeysSync('actions.changeBranch') || keyBindings.actions.changeBranch.keys
  );

  // -----------------Teener cuenta suscribirse a los eventos de cambio de teclasss--------
  // Suscribirse a cambios
  useEffect(() => {
    const unsubscribe = subscribeToKeybindingsChanges(() => {
      setCommandPaletteKeys(getKeysSync('actions.openCommandPalette') || keyBindings.actions.openCommandPalette.keys);
      setCloseModalKeys(getKeysSync('actions.closeModal') || keyBindings.actions.closeModal.keys);
      setCartKeys(getKeysSync('actions.openCart') || keyBindings.actions.openCart.keys);
      setNotificationsKeys(getKeysSync('actions.openNotifications') || keyBindings.actions.openNotifications.keys);
      setBranchKeys(getKeysSync('actions.changeBranch') || keyBindings.actions.changeBranch.keys);
    });

    return unsubscribe;
  }, []);

  // Ctrl+K para abrir/cerrar command palette
  useHotkeys(commandPaletteKeys, (e) => {
    e.preventDefault();
    if (commandPaletteOpen && onCloseCommandPalette) {
      onCloseCommandPalette();
    } else if (onOpenCommandPalette) {
      onOpenCommandPalette();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!(onOpenCommandPalette || onCloseCommandPalette)
  }, [commandPaletteKeys, commandPaletteOpen, onOpenCommandPalette, onCloseCommandPalette]);

  // Escape para cerrar command palette
  useHotkeys(closeModalKeys, (e) => {
    e.preventDefault();
    if (onCloseCommandPalette) {
      onCloseCommandPalette();
    }
  }, {
    enableOnFormTags: true,
    enabled: commandPaletteOpen && !!onCloseCommandPalette
  }, [closeModalKeys, commandPaletteOpen, onCloseCommandPalette]);

  // Alt+C para abrir carrito
  useHotkeys(cartKeys, (e) => {
    e.preventDefault();
    if (onOpenCart) {
      onOpenCart();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!onOpenCart
  }, [cartKeys, onOpenCart]);

  // Alt+N para notificaciones
  useHotkeys(notificationsKeys, (e) => {
    e.preventDefault();
    if (onOpenNotifications) {
      onOpenNotifications();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!onOpenNotifications
  }, [notificationsKeys, onOpenNotifications]);

  // Ctrl+Shift+B para cambiar sucursal
  useHotkeys(branchKeys, (e) => {
    e.preventDefault();
    if (onChangeBranch) {
      onChangeBranch();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!onChangeBranch
  }, [branchKeys, onChangeBranch]);

  return {
    // Retornamos las funciones para que el componente las pueda usar
    openCommandPalette: onOpenCommandPalette,
    closeCommandPalette: onCloseCommandPalette,
    openCart: onOpenCart,
    openNotifications: onOpenNotifications,
    changeBranch: onChangeBranch
  };
};
