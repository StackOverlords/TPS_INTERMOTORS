import type { ViewConfiguration } from "@/view-configs/viewConfigTypes";

export const productsListViewConfig: ViewConfiguration = {
  id: 'products-list',
  name: 'Lista de Productos',
  module: 'Productos',
  path: '/dashboard/productos',

  features: {
    refreshButton: {
      enabled: true,
      label: 'Recargar',
      description: 'Recargar la lista de productos',
    },

    resetTableButton: {
      enabled: false,
      label: 'Resetear Tabla',
      description: 'Resetear orden, visibilidad y tamaños de columnas',
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

    searchBar: {
      enabled: true,
      label: 'Filtros de Búsqueda',
      description: 'Búsqueda por múltiples criterios',
    },

    infiniteScroll: {
      enabled: true,
      label: 'Scroll Infinito',
      description: 'Activar scroll infinito en lugar de paginación',
    },

    pagination: {
      enabled: true,
      label: 'Paginación',
      description: 'Mostrar controles de paginación',
    },

    multiSelect: {
      enabled: true,
      label: 'Selección Múltiple',
      description: 'Permitir seleccionar múltiples productos',
    },

    keyboardNavigation: {
      enabled: true,
      label: 'Navegación con Teclado',
      description: 'Permitir navegar con flechas del teclado',
    },

    editButton: {
      enabled: true,
      label: 'Editar Producto',
      description: 'Permitir editar productos desde la lista',
    },

    deleteButton: {
      enabled: false,
      label: 'Eliminar Producto',
      description: 'Permitir eliminar productos',
    },

    addToCart: {
      enabled: true,
      label: 'Agregar al Carrito',
      description: 'Permitir agregar productos al carrito',
    },

    bulkAddToCart: {
      enabled: true,
      label: 'Agregar Múltiples al Carrito',
      description: 'Agregar productos seleccionados al carrito',
    },

    viewImage: {
      enabled: true,
      label: 'Ver Imagen',
      description: 'Ver imagen del producto en modal',
    },

    viewDetails: {
      enabled: true,
      label: 'Ver Detalles',
      description: 'Ver detalles del producto en modal',
    },

    quickView: {
      enabled: true,
      label: 'Vista Rápida',
      description: 'Abrir modal de vista rápida con Enter',
    },

    priceAlternative: {
      enabled: true,
      label: 'Precio Alternativo',
      description: 'Mostrar precio de venta alternativo',
    },

    advancedFilters: {
      enabled: false,
      label: 'Filtros Avanzados',
      description: 'Mostrar filtros adicionales (subcategoría, medida, motor)',
    },

    categoryFilter: {
      enabled: true,
      label: 'Filtro de Categoría',
      description: 'Filtrar por categoría',
    },

    brandFilter: {
      enabled: true,
      label: 'Filtro de Marca',
      description: 'Filtrar por marca',
    },

    subcategoryFilter: {
      enabled: false,
      label: 'Filtro de Subcategoría',
      description: 'Filtrar por subcategoría',
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
    bottomShoppingCartPanel: {
      enabled: true,
      label: 'Panel de Carrito',
      description: 'Mostrar panel inferior con el carrito de compras',
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

    // Carrito de compras
    autoCloseModalOnAddToCart: true,
    showSuccessToastOnAddToCart: true,
    allowAddToCartFromModal: true,

    // Modal de producto
    productModalSize: 'large',
    showRelatedProducts: false,
    showPriceHistory: false,

    // Stock
    stockLowThreshold: 10,
    stockCriticalThreshold: 5,
    highlightLowStock: true,

    // Imágenes
    imageModalSize: 'large',
    enableImageZoom: true,
    showImagePlaceholder: true,

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
    exportFileName: 'productos',
    includeHiddenColumns: false,
  },

  // ✅ Configuración de tabla (separada y organizada)
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