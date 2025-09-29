import authSDK from '../services/sdk-simple-auth';

export interface KeybindingAction {
  id: string;
  keys: string;
  description: string;
  category: string;
  permission?: string; // Permission required to use this keybinding
  contexts?: string[]; // Where this keybinding is active (e.g., ['forms', 'tables', 'global'])
  enabled?: boolean;
  action: () => void | ((context?: any) => void);
  preventDefault?: boolean;
  enableOnFormTags?: boolean;
}

export interface KeybindingCategory {
  id: string;
  name: string;
  description: string;
  actions: KeybindingAction[];
}

export interface KeybindingContext {
  [actionId: string]: KeybindingAction;
}

// Permission checker utility
export const hasPermission = (permission?: string): boolean => {
  if (!permission) return true;

  try {
    const user = authSDK.getCurrentUser();
    if (!user || !user.permissions) return false;

    return user.permissions.some((p: any) => p.name === permission);
  } catch {
    return false;
  }
};

// Global keybindings - Available everywhere
export const globalKeybindings: KeybindingCategory = {
  id: 'global',
  name: 'Global',
  description: 'Atajos disponibles en toda la aplicación',
  actions: [
    {
      id: 'open_command_palette',
      keys: 'ctrl+k',
      description: 'Abrir paleta de comandos',
      category: 'navigation',
      contexts: ['global'],
      action: () => {
        // Will be injected by KeybindingProvider
      },
      preventDefault: true,
      enableOnFormTags: true,
    },
    {
      id: 'close_modal',
      keys: 'escape',
      description: 'Cerrar modal/diálogo',
      category: 'navigation',
      contexts: ['global'],
      action: () => {
        // Will be injected by KeybindingProvider
      },
      preventDefault: true,
      enableOnFormTags: true,
    },
    {
      id: 'show_shortcuts',
      keys: 'ctrl+shift+?',
      description: 'Mostrar lista de atajos',
      category: 'help',
      contexts: ['global'],
      action: () => {
        // Will be injected by KeybindingProvider
      },
      preventDefault: true,
      enableOnFormTags: true,
    }
  ]
};

// Form-specific keybindings
export const formKeybindings: KeybindingCategory = {
  id: 'forms',
  name: 'Formularios',
  description: 'Atajos para navegación y acciones en formularios',
  actions: [
    {
      id: 'save_form',
      keys: 'alt+s',
      description: 'Guardar formulario',
      category: 'action',
      contexts: ['forms'],
      action: () => {
        // Will be injected by context
      },
      preventDefault: true,
      enableOnFormTags: false,
    },
    {
      id: 'next_field',
      keys: 'ctrl+tab',
      description: 'Siguiente campo',
      category: 'navigation',
      contexts: ['forms'],
      action: () => {
        // Will be injected by context
      },
      preventDefault: true,
      enableOnFormTags: true,
    },
    {
      id: 'prev_field',
      keys: 'ctrl+shift+tab',
      description: 'Campo anterior',
      category: 'navigation',
      contexts: ['forms'],
      action: () => {
        // Will be injected by context
      },
      preventDefault: true,
      enableOnFormTags: true,
    },
    {
      id: 'reset_form',
      keys: 'ctrl+r',
      description: 'Limpiar formulario',
      category: 'action',
      contexts: ['forms'],
      action: () => {
        // Will be injected by context
      },
      preventDefault: true,
      enableOnFormTags: false,
    }
  ]
};

// Module-specific keybindings with permissions
export const moduleKeybindings: KeybindingCategory[] = [
  {
    id: 'purchases',
    name: 'Compras',
    description: 'Atajos para el módulo de compras',
    actions: [
      {
        id: 'new_purchase',
        keys: 'ctrl+n',
        description: 'Nueva compra',
        category: 'action',
        permission: 'com-create',
        contexts: ['purchases', 'purchases-list'],
        action: () => {
          // Navigate to new purchase
        },
        preventDefault: true,
      },
      {
        id: 'search_purchases',
        keys: 'ctrl+f',
        description: 'Buscar compras',
        category: 'navigation',
        permission: 'com-list',
        contexts: ['purchases', 'purchases-list'],
        action: () => {
          // Focus search input
        },
        preventDefault: true,
      },
      {
        id: 'print_purchase',
        keys: 'ctrl+p',
        description: 'Imprimir compra',
        category: 'action',
        permission: 'com-view_print',
        contexts: ['purchases-detail', 'purchases-edit'],
        action: () => {
          // Print current purchase
        },
        preventDefault: true,
      }
    ]
  },
  {
    id: 'sales',
    name: 'Ventas',
    description: 'Atajos para el módulo de ventas',
    actions: [
      {
        id: 'new_sale',
        keys: 'ctrl+n',
        description: 'Nueva venta',
        category: 'action',
        permission: 'ven-create',
        contexts: ['sales', 'sales-list'],
        action: () => {
          // Navigate to new sale
        },
        preventDefault: true,
      },
      {
        id: 'open_cart',
        keys: 'alt+c',
        description: 'Abrir carrito',
        category: 'navigation',
        permission: 'cve-module',
        contexts: ['sales', 'cart'],
        action: () => {
          // Open shopping cart
        },
        preventDefault: true,
      },
      {
        id: 'search_products',
        keys: 'ctrl+shift+f',
        description: 'Buscar productos',
        category: 'navigation',
        permission: 'cve-list',
        contexts: ['sales', 'cart'],
        action: () => {
          // Focus product search
        },
        preventDefault: true,
      }
    ]
  },
  {
    id: 'inventory',
    name: 'Inventario',
    description: 'Atajos para el módulo de inventario',
    actions: [
      {
        id: 'search_inventory',
        keys: 'ctrl+f',
        description: 'Buscar en inventario',
        category: 'navigation',
        permission: 'inv-module',
        contexts: ['inventory'],
        action: () => {
          // Focus inventory search
        },
        preventDefault: true,
      }
    ]
  }
];

// Table navigation keybindings
export const tableKeybindings: KeybindingCategory = {
  id: 'tables',
  name: 'Tablas',
  description: 'Navegación en tablas y listas',
  actions: [
    {
      id: 'activate_table_nav',
      keys: 'alt+t',
      description: 'Activar navegación en tabla',
      category: 'navigation',
      contexts: ['tables'],
      action: () => {
        // Will be injected by table context
      },
      preventDefault: true,
    },
    {
      id: 'select_row',
      keys: 'space',
      description: 'Seleccionar fila',
      category: 'action',
      contexts: ['tables'],
      action: () => {
        // Will be injected by table context
      },
      preventDefault: true,
    },
    {
      id: 'edit_row',
      keys: 'enter',
      description: 'Editar elemento seleccionado',
      category: 'action',
      contexts: ['tables'],
      action: () => {
        // Will be injected by table context
      },
      preventDefault: true,
    }
  ]
};

// Combine all keybindings
export const allKeybindings: KeybindingCategory[] = [
  globalKeybindings,
  formKeybindings,
  tableKeybindings,
  ...moduleKeybindings
];

// Helper functions
export const getKeybindingsByContext = (context: string): KeybindingAction[] => {
  return allKeybindings
    .flatMap(category => category.actions)
    .filter(action =>
      action.contexts?.includes(context) ||
      action.contexts?.includes('global')
    )
    .filter(action => hasPermission(action.permission));
};

export const getKeybindingById = (id: string): KeybindingAction | undefined => {
  return allKeybindings
    .flatMap(category => category.actions)
    .find(action => action.id === id);
};

export const getEnabledKeybindings = (): KeybindingAction[] => {
  return allKeybindings
    .flatMap(category => category.actions)
    .filter(action => action.enabled !== false)
    .filter(action => hasPermission(action.permission));
};