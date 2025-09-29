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
  tableAndFilters:{
    nextRow: {
      keys: 'down',
      description: 'Mover selección a la fila siguiente en tablas',
    },
    prevRow: {
      keys: 'up',
      description: 'Mover selección a la fila anterior en tablas',
    },
    firstRow: {
      keys: 'home',
      description: 'Mover selección a la primera fila en tablas',
    },
    lastRow: {
      keys: 'end',
      description: 'Mover selección a la última fila en tablas',
    },
    nextFilter: {
      keys: 'tab',
      description: 'Mover foco al siguiente filtro',
    },
    prevFilter: {
      keys: 'ctrl+shift+tab',
      description: 'Mover foco al filtro anterior',
    },
    filter1:{
      keys: 'ctrl+1',
      description: 'Foco en filtro 1',
    },
    filter2:{
      keys: 'ctrl+2',
      description: 'Foco en filtro 2',
    },
    filter3:{
      keys: 'ctrl+3',
      description: 'Foco en filtro 3',
    },
    filter4:{
      keys: 'ctrl+4',
      description: 'Foco en filtro 4',
    },
    filter5:{
      keys: 'ctrl+5',
      description: 'Foco en filtro 5',
    },
    filter6:{
      keys: 'ctrl+6',
      description: 'Foco en filtro 6',
    },
  },
  actions: {
    openCommandPalette: {
      keys: 'ctrl+k',
      description: 'Abrir/cerrar menú',
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