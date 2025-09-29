const keyBindings = {
  forms: {
    save: {
      keys: 'alt+s',
      description: 'Guardar formulario',
    },
    resetForm: {
      keys: 'alt+r',
      description: 'Resetear formulario',
    },
    cancel: {
      keys: 'escape',
      description: 'Cancelar acción o cerrar modal',
    },
  },
  navigation: {
    nextField: {
      keys: 'tab',
      description: 'Navegar al siguiente campo en formularios',
    },
    prevField: {
      keys: 'ctrl+shift+tab',
      description: 'Navegar al campo anterior en formularios',
    },
  },
  modal: {
    close: {
      keys: 'escape',
      description: 'Cerrar modales o diálogos',
    },
  },
  actions: {
    openCommandPalette: {
      keys: 'ctrl+k',
      description: 'Abrir/cerrar paleta de comandos',
    },
    closeModal: {
      keys: 'escape',
      description: 'Cerrar modales o diálogos',
    },
    openShortcuts: {
      keys: 'ctrl+shift+?',
      description: 'Mostrar ayuda de atajos de teclado',
    },
    openCart: {
      keys: 'alt+c',
      description: 'Abrir carrito de compras',
    },
    openNotifications: {
      keys: 'alt+n',
      description: 'Abrir notificaciones',
    },
    changeBranch: {
      keys: 'ctrl+shift+b',
      description: 'Cambiar sucursal',
    },
    close: {
      keys: 'escape',
      description: 'Cerrar modales o diálogos',
    },
  },
};

export default keyBindings;