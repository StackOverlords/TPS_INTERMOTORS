import type { ViewConfiguration } from "@/config/viewConfigTypes";

export const userListConfig: ViewConfiguration = {
  id: 'users-list',
  name: 'Listar Usuarios',
  module: 'Usuarios',
  path: '/dashboard/user',

  features: {
    refreshButton: {
      enabled: true,
      label: 'Recargar',
      description: 'Recargar la lista de usuarios'
    },
    filters: {
      enabled: true,
      label: 'Filtros',
      description: 'Filtrar usuarios por criterios'
    },
    searchBar: {
      enabled: true,
      label: 'Buscar',
      description: 'Buscar usuarios por nickname o nombre'
    },
    infiniteScroll: {
      enabled: true,
      label: 'Scroll Infinito',
      description: 'Activar scroll infinito en lugar de paginación'
    },
    resetTableButton: {
      enabled: true,
      label: 'Resetear Tabla',
      description: 'Resetear orden y visibilidad de columnas'
    },
    columnSelector: {
      enabled: true,
      label: 'Columnas',
      description: 'Seleccionar columnas visibles'
    },
    multiSelect: {
      enabled: true,
      label: 'Selección Múltiple',
      description: 'Permitir seleccionar múltiples filas'
    },
    pagination: {
      enabled: true,
      label: 'Paginación',
      description: 'Mostrar controles de paginación'
    },
    keyboardNavigation: {
      enabled: true,
      label: 'Navegación con Teclado',
      description: 'Permitir navegar con flechas del teclado'
    },
  },

  behaviors: {
    openDetailsIn: 'same-page', // 'same-page' | 'new-tab' | 'modal' | 'window'
    persistFilters: true,
    persistColumnOrder: true,
    persistColumnVisibility: true,
    persistColumnSizes: true,
    defaultRowsPerPage: 15, // Número de filas por página
    defaultSearchMode: 'realtime', // 'realtime' | 'manual'
    requireConfirmationOnDelete: true,
    allowBulkActions: true,
  }
}

export const userDetailsConfig: ViewConfiguration = {
  id: 'user-detail',
  name: 'Detalle de Usuario',
  module: 'Usuarios',
  path: '/dashboard/user/:nickname',
  features: {
    permissions: {
      enabled: true,
      label: 'Gestión de Permisos',
      description: 'Gestiona los permisos del usuario'
    },
    saveButton: {
      enabled: true,
      label: 'Guardar Permisos',
      description: 'Guardar cambios en los permisos del usuario'
    }
  },
  behaviors: {
    // No specific behaviors for detail view for now
  }
}