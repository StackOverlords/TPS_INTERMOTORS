import type { CommandDefinition } from './types';

/**
 * Registro centralizado de todos los comandos del sistema
 * Migrado y mejorado desde global.keys.ts
 */
export const COMMANDS = {
  // ==================== FORMS ====================
  'forms.save': {
    defaultKeys: 'alt+s',
    description: 'Guardar formulario',
    when: 'formFocus',
    category: 'forms',
  },
  'forms.reset': {
    defaultKeys: 'alt+r',
    description: 'Resetear formulario',
    when: 'formFocus',
    category: 'forms',
  },
  // 'forms.cancel': {
  //   defaultKeys: 'escape',
  //   description: 'Cancelar acción o cerrar modal',
  //   when: 'formFocus',
  //   category: 'forms',
  // },

  // ==================== NAVIGATION ====================
  'navigation.nextField': {
    defaultKeys: 'tab',
    description: 'Navegar al siguiente campo en formularios',
    when: 'formFocus',
    category: 'navigation',
  },
  'navigation.prevField': {
    defaultKeys: 'ctrl+shift+tab',
    description: 'Navegar al campo anterior en formularios',
    when: 'formFocus',
    category: 'navigation',
  },

  // ==================== MODAL ====================
  // 'modal.close': {
  //   defaultKeys: 'escape',
  //   description: 'Cerrar modales o diálogos',
  //   when: 'modalOpen',
  //   category: 'modal',
  // },

  // ==================== TABLES & FILTERS ====================
  'table.nextRow': {
    defaultKeys: 'down',
    description: 'Mover selección a la fila siguiente en tablas',
    when: 'tableFocus',
    category: 'tableAndFilters',
  },
  'table.prevRow': {
    defaultKeys: 'up',
    description: 'Mover selección a la fila anterior en tablas',
    when: 'tableFocus',
    category: 'tableAndFilters',
  },
  'table.firstRow': {
    defaultKeys: 'home',
    description: 'Mover selección a la primera fila en tablas',
    when: 'tableFocus',
    category: 'tableAndFilters',
  },
  'table.lastRow': {
    defaultKeys: 'end',
    description: 'Mover selección a la última fila en tablas',
    when: 'tableFocus',
    category: 'tableAndFilters',
  },
  'tableAndFilters.nextFilter': {
    defaultKeys: 'tab',
    description: 'Mover foco al siguiente filtro',
    category: 'tableAndFilters',
  },
  'tableAndFilters.prevFilter': {
    defaultKeys: 'ctrl+shift+tab',
    description: 'Mover foco al filtro anterior',
    category: 'tableAndFilters',
  },
  'tableAndFilters.filter1': {
    defaultKeys: 'ctrl+1',
    description: 'Foco en filtro 1',
    category: 'tableAndFilters',
  },
  'tableAndFilters.filter2': {
    defaultKeys: 'ctrl+2',
    description: 'Foco en filtro 2',
    category: 'tableAndFilters',
  },
  'tableAndFilters.filter3': {
    defaultKeys: 'ctrl+3',
    description: 'Foco en filtro 3',
    category: 'tableAndFilters',
  },
  'tableAndFilters.filter4': {
    defaultKeys: 'ctrl+4',
    description: 'Foco en filtro 4',
    category: 'tableAndFilters',
  },
  'tableAndFilters.filter5': {
    defaultKeys: 'ctrl+5',
    description: 'Foco en filtro 5',
    category: 'tableAndFilters',
  },
  'tableAndFilters.filter6': {
    defaultKeys: 'ctrl+6',
    description: 'Foco en filtro 6',
    category: 'tableAndFilters',
  },

  // ==================== ACTIONS ====================
  'actions.commandPalette': {
    defaultKeys: 'ctrl+k',
    description: 'Abrir/cerrar menú',
    when: 'global',
    category: 'actions',
  },
  'actions.closeModal': {
    defaultKeys: 'escape',
    description: 'Cerrar modales o diálogos',
    when: 'modalOpen',
    category: 'actions',
  },
  'actions.showShortcuts': {
    defaultKeys: 'ctrl+shift+?',
    description: 'Mostrar ayuda de atajos de teclado',
    when: 'global',
    category: 'actions',
  },
  'actions.openCart': {
    defaultKeys: 'alt+c',
    description: 'Abrir carrito de compras',
    when: 'global',
    category: 'actions',
  },
  'actions.openNotifications': {
    defaultKeys: 'alt+n',
    description: 'Abrir notificaciones',
    when: 'global',
    category: 'actions',
  },
  'actions.changeBranch': {
    defaultKeys: 'ctrl+shift+b',
    description: 'Cambiar sucursal',
    when: 'global',
    category: 'actions',
  },
  'actions.toggleSidebar': {
    defaultKeys: 'ctrl+b',
    description: 'Mostrar/ocultar barra lateral',
    when: 'global',
    category: 'actions',
  },
  'actions.zoomIn': {
    defaultKeys: 'ctrl + plus',
    description: 'Acercar (Zoom In)',
    when: 'global',
    category: 'actions',
  },
  'actions.zoomOut': {
    defaultKeys: 'ctrl+minus',
    description: 'Alejar (Zoom Out)',
    when: 'global',
    category: 'actions',
  },
  'actions.zoomReset': {
    defaultKeys: 'ctrl+0',
    description: 'Restablecer Zoom',
    when: 'global',
    category: 'actions',
  },

  // ==================== TABS ====================
  'tabs.previous': {
    defaultKeys: 'ctrl+shift+tab',
    description: 'Navegar al tab anterior',
    when: 'global',
    category: 'tabs',
  },
  'tabs.next': {
    defaultKeys: 'ctrl+tab',
    description: 'Navegar al siguiente tab',
    when: 'global',
    category: 'tabs',
  },
  'tabs.close': {
    defaultKeys: 'ctrl+w',
    description: 'Cerrar el tab actual',
    when: 'global',
    category: 'tabs',
  },
  'tabs.toggleMenu': {
    defaultKeys: 'ctrl+t',
    description: 'Abrir/cerrar menú de pestañas',
    when: 'global',
    category: 'tabs',
  },
  // ==================== SEARCH-FILTERS ====================
  // Para que ejecute el boton de busca en los listados etc. en lugar de presionar el boton
  'searchFilters.focusSearch': {
    defaultKeys: 'alt+b',
    description: 'Foco en campo de búsqueda o filtros',
    when: 'global',
    category: 'tableAndFilters',
  },
} as const satisfies Record<string, CommandDefinition>;

/**
 * Type-safe command IDs
 */
export type CommandId = keyof typeof COMMANDS;

/**
 * Categorías con nombres amigables
 */
export const CATEGORIES = {
  forms: 'Formularios',
  navigation: 'Navegación',
  modal: 'Modales',
  tableAndFilters: 'Tablas y Filtros',
  actions: 'Acciones',
  tabs: 'Pestañas',
} as const;

export type CategoryId = keyof typeof CATEGORIES;

/**
 * Obtiene todos los comandos de una categoría específica
 */
export function getCommandsByCategory(category: CategoryId): Record<string, CommandDefinition> {
  const commands: Record<string, CommandDefinition> = {};

  for (const [id, command] of Object.entries(COMMANDS)) {
    if (command.category === category) {
      commands[id] = command;
    }
  }

  return commands;
}

/**
 * Obtiene la definición de un comando por ID
 */
export function getCommand(commandId: CommandId): CommandDefinition | undefined {
  return COMMANDS[commandId];
}

/**
 * Verifica si un ID de comando existe
 */
export function isValidCommandId(id: string): id is CommandId {
  return id in COMMANDS;
}
