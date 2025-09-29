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

  // Ctrl+K para abrir/cerrar command palette
  useHotkeys(keyBindings.actions.openCommandPalette.keys, (e) => {
    e.preventDefault();
    if (commandPaletteOpen && onCloseCommandPalette) {
      onCloseCommandPalette();
    } else if (onOpenCommandPalette) {
      onOpenCommandPalette();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!(onOpenCommandPalette || onCloseCommandPalette)
  });

  // Escape para cerrar command palette
  useHotkeys(keyBindings.actions.closeModal.keys, (e) => {
    e.preventDefault();
    if (onCloseCommandPalette) {
      onCloseCommandPalette();
    }
  }, {
    enableOnFormTags: true,
    enabled: commandPaletteOpen && !!onCloseCommandPalette
  });

  // Alt+C para abrir carrito
  useHotkeys(keyBindings.actions.openCart.keys, (e) => {
    e.preventDefault();
    if (onOpenCart) {
      onOpenCart();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!onOpenCart
  });

  // Alt+N para notificaciones
  useHotkeys(keyBindings.actions.openNotifications.keys, (e) => {
    e.preventDefault();
    if (onOpenNotifications) {
      onOpenNotifications();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!onOpenNotifications
  });

  // Ctrl+Shift+B para cambiar sucursal
  useHotkeys(keyBindings.actions.changeBranch.keys, (e) => {
    e.preventDefault();
    if (onChangeBranch) {
      onChangeBranch();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!onChangeBranch
  });

  return {
    // Retornamos las funciones para que el componente las pueda usar
    openCommandPalette: onOpenCommandPalette,
    closeCommandPalette: onCloseCommandPalette,
    openCart: onOpenCart,
    openNotifications: onOpenNotifications,
    changeBranch: onChangeBranch
  };
};