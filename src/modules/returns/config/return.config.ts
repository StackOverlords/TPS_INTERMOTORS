import type { ViewConfiguration } from "@/view-configs/viewConfigTypes";

export const returnsListViewConfig: ViewConfiguration = {
  id: 'returns-list',
  name: 'Lista de Devoluciónes',
  module: 'Devoluciónes',
  path: '/dashboard/returns',

  features: {
    refreshButton: {
      enabled: true,
      label: 'Recargar',
      description: 'Recargar la lista de devoluciónes',
    },

    resetTableButton: {
      enabled: false,
      label: 'Resetear Tabla',
      description: 'Resetear orden, visibilidad y tamaños de columnas',
    },

    searchModeToggle: {
      enabled: true,
      label: 'Modo de búsqueda',
      description: 'Cambiar entre búsqueda manual y en tiempo real',
    },

    clearFiltersButton: {
      enabled: true,
      label: 'Limpiar filtros',
      description: 'Restablecer todos los filtros de búsqueda',
    },

    showFiltersButton: {
      enabled: true,
      label: 'Mostrar/Ocultar filtros',
      description: 'Mostrar u ocultar los filtros avanzados',
    },

    keywordFilter: {
      enabled: true,
      label: 'Palabras clave',
      description: 'Buscar devoluciónes por texto libre',
    },

    returnNumberFilter: {
      enabled: true,
      label: 'Nro. de devolución',
      description: 'Filtrar por número interno de la devolución',
    },

    responsibleFilter: {
      enabled: true,
      label: 'Responsable',
      description: 'Filtrar devoluciónes por responsable',
    },

    startDateFilter: {
      enabled: true,
      label: 'Fecha inicio',
      description: 'Fecha mínima de la devolución',
    },

    endDateFilter: {
      enabled: true,
      label: 'Fecha fin',
      description: 'Fecha máxima de la devolución',
    },

    productOemFilter: {
      enabled: true,
      label: 'Código OEM',
      description: 'Filtrar devoluciónes por código OEM del producto',
    },

    dateShortcuts: {
      enabled: true,
      label: 'Atajos de fecha',
      description: 'Botones rápidos para rangos de fechas comunes',
    },

    lastWeekShortcut: {
      enabled: false,
      label: 'Última semana',
      description: 'Filtrar devoluciónes de los últimos 7 días',
    },

    lastMonthShortcut: {
      enabled: false,
      label: 'Último mes',
      description: 'Filtrar devoluciónes del último mes',
    },

    clearDatesButton: {
      enabled: false,
      label: 'Limpiar fechas',
      description: 'Eliminar filtros de fecha inicio y fin',
    },

    columnSelector: {
      enabled: true,
      label: 'Columnas',
      description: 'Seleccionar columnas visibles',
    },

    hideFiltersButton: {
      enabled: false,
      label: 'Ocultar Filtros',
      description: 'Mostrar/ocultar botón de ocultar filtros',
    },

    newSearchButton: {
      enabled: true,
      label: 'Nueva Búsqueda',
      description: 'Botón para iniciar una nueva búsqueda',
    },

    infiniteScroll: {
      enabled: false,
      label: 'Scroll Infinito',
      description: 'Activar scroll infinito en lugar de paginación',
    },

    infiniteScrollToggle: {
      enabled: true,
      label: 'Botón de scroll infinito',
      description: 'Cargar más devoluciónes automáticamente al hacer scroll',
    },

    pagination: {
      enabled: true,
      label: 'Paginación',
      description: 'Mostrar controles de paginación',
    },

    multiSelect: {
      enabled: true,
      label: 'Selección Múltiple',
      description: 'Permitir seleccionar múltiples devoluciónes',
    },

    keyboardNavigation: {
      enabled: true,
      label: 'Navegación con Teclado',
      description: 'Permitir navegar con flechas del teclado',
    },

    editButton: {
      enabled: true,
      label: 'Editar Devolución',
      description: 'Permitir editar devoluciónes desde la lista',
    },

    deleteButton: {
      enabled: true,
      label: 'Eliminar Devolución',
      description: 'Permitir eliminar devoluciónes',
    },

    keyboardShortcutsHelp: {
      enabled: true,
      label: 'Ayuda de Atajos',
      description: 'Mostrar tooltip con atajos de teclado',
    },

    filterShortcutsHelp: {
      enabled: true,
      label: 'Ayuda de Filtros',
      description: 'Mostrar tooltip con atajos de filtros',
    },
  },

  behaviors: {
    // Configuraciones por defecto
    defaultSearchMode: 'manual',

    // Comportamiento de filtros (de búsqueda, NO de tabla)
    autoApplyFilters: false,
    clearFiltersOnMount: false,
    resetFiltersOnBranchChange: true,

    // Confirmaciones
    requireConfirmationOnDelete: true,
    requireConfirmationOnBulkDelete: true,

    // Scroll infinito
    infiniteScrollThreshold: 0.8,
    infiniteScrollBatchSize: 20,

    // Navegación
    enableKeyboardShortcuts: true,
    focusTableOnMount: false,

    // Filtros de búsqueda
    showFiltersOnMount: true,
    collapseFiltersOnMobile: true,

    // Rendimiento
    debounceSearchMs: 300,

    // Exportación
    exportFormat: 'xlsx',
    exportFileName: 'devoluciónes',
    includeHiddenColumns: false,
  },

  table: {
    // Comportamientos de la tabla
    behaviors: {
      // Persistencia - QUÉ se guarda
      persistColumnVisibility: true,
      persistColumnOrder: true,
      persistColumnSizes: true,
      persistPagination: true,
      persistSorting: true,
      persistFilters: false, // Filtros de tabla, no de búsqueda

      // Configuración de tabla
      enableColumnReordering: true,
      enableColumnResizing: true,
      columnResizeMode: 'onChange',
      minColumnWidth: 30,
      maxColumnWidth: 800,

      // Paginación
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],

      // Ordenamiento
      defaultSortField: 'id',
      defaultSortOrder: 'desc',
      allowMultiSort: false,

      // Selección
      allowBulkActions: true,
      clearSelectionOnPageChange: false,
      maxSelectableItems: 100,

      // Virtualización
      enableVirtualization: false,
      virtualScrollOverscan: 5,

      // Rendimiento
      debounceMs: 300,
    },

    // Estado inicial/default (solo si no hay configuración guardada)
    state: {
      columnVisibility: {
        "Select": false,
      },
      columnOrder: [],
      columnSizes: {},
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
      sorting: [
        {
          id: 'id',
          desc: false,
        },
      ],
    },
  },
};