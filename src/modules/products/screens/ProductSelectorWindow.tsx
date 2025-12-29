/**
 * ProductSelectorWindow - Ventana Standalone para Selección de Productos
 * Con validación de stock configurable y cálculo interno
 */

import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Label } from '@/components/atoms/label';
import { Switch } from '@/components/atoms/switch';
import CustomizableTable from '@/components/common/CustomizableTable';
import Pagination from '@/components/common/pagination';
import TooltipButton from '@/components/common/TooltipButton';
import { useKeyboardNavigation } from '@/hooks/keyBindings/useKeyboardNavigation';
import { useCustomTable } from '@/hooks/useCustomTable';
import ProductFilters from '@/modules/products/components/productList/productFilters';
import { useProductsPaginated } from '@/modules/products/hooks/queries/useProductsPaginated';
import { useProductFilters } from '@/modules/products/hooks/useProductFilters';
import type { ProductGet } from '@/modules/products/types/ProductGet';
import { useBranchStore } from '@/states/branchStore';
import { formatCell } from '@/utils/formatCell';
import { formatCurrency } from '@/utils/formaters';
import { emitToWindow } from '@/utils/tauriWindows';
import { type ColumnDef } from '@tanstack/react-table';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import {
  Check,
  Package,
  Plus,
  RefreshCcw,
  X,
  Zap,
  Trash2,
  PackageSearch,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProductSelection } from '../hooks/useProductSelection';
import type { SelectedItem } from '@/types/windowSelectedItems';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/hooks/use-toast-enhanced';
import { ColumnVisibilityDropdown } from '@/components/common/ColumnVisibilityDropdown';
import type { ProductFilters as ProductFiltersTypes } from '../types/productFilters';
import { useCommands } from '@/keybindings';

type ProductSelectorContext =
  | 'purchase'
  | 'sale'
  | 'transfer'
  | 'quote'
  | 'inventory'
  | string;

interface WindowConfig {
  windowId: string;
  context: ProductSelectorContext;
  multiSelect: boolean;
  mode: 'create' | 'edit';
  validateStock: boolean; // Nueva propiedad
  selectedItems: SelectedItem[];
  initialFilters?: Record<string, any>;
}


const ProductSelectorWindow: React.FC = () => {
  const currentWindow = getCurrentWebviewWindow();
  const selectedBranchId = useBranchStore(s => s.selectedBranchId);
  const tableRef = useRef<HTMLTableElement>(null);

  const config: WindowConfig = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    const selectedItemsParam = params.get('selectedItems');
    let selectedItems: SelectedItem[] = [];
    if (selectedItemsParam) {
      try {
        selectedItems = JSON.parse(selectedItemsParam);
      } catch (e) {
        console.error('Error parsing selectedItems:', e);
      }
    }

    return {
      windowId: params.get('windowId') || 'product-selector-default',
      context: params.get('context') || 'default',
      multiSelect: params.get('multiSelect') === 'true',
      mode: (params.get('mode') as 'create' | 'edit') || 'create',
      validateStock: params.get('validateStock') !== 'false', // Por defecto true
      selectedItems,
    };
  }, []);

  const STORAGE_KEY = config.windowId + '-product-filters';
  const [isMultiSelect, setIsMultiSelect] = useState<boolean>(false);
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);
  const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>('manual');
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const hasLoadedFilters = useRef(false);

  // Map de items seleccionados para búsqueda rápida
  const selectedItemsMap = useMemo(() => {
    const map = new Map<number, SelectedItem>();
    config.selectedItems.forEach(item => {
      map.set(item.productId, item);
    });
    return map;
  }, [config.selectedItems]);

  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    setPage,
    applyFilters,
    setPageSize,
    setFilters,
    resetFilters,
  } = useProductFilters(Number(selectedBranchId) || 1);

  const activeFilters = searchMode === 'realtime' ? debouncedFilters : appliedFilters;

  // 🔥 Cargar filtros persistidos al montar
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && !hasLoadedFilters.current) {
          const parsed: ProductFiltersTypes = JSON.parse(saved);

          // Aplicar filtros guardados
          setFilters({
            pagina: parsed.pagina ?? 1,
            pagina_registros: parsed.pagina_registros ?? 10,
            sucursal: parsed.sucursal ?? 0,
            descripcion: parsed.descripcion || "",
            codigo_oem: parsed.codigo_oem || "",
            codigo_upc: parsed.codigo_upc || "",
            categoria: parsed.categoria || 0,
            marca: parsed.marca || '',
            medida: parsed.medida || "",
            nro_motor: parsed.nro_motor || "",
            modelo: parsed.modelo || "",
            producto: parsed.producto || 0,
            subcategoria: parsed.subcategoria || 0,
          });
          hasLoadedFilters.current = true;
        }
      } catch (e) {
        console.error('Error loading filters:', e);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    if (hasLoadedFilters.current && searchMode === 'manual') {
      const timer = setTimeout(() => {
        applyFilters();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [hasLoadedFilters.current]);

  // 🔥 Guardar filtros cuando cambien
  const saveFilters = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      console.error('Error saving filters:', e);
    }
  }, [filters]);

  const {
    data: productData,
    isLoading,
    isFetching,
    isError,
    refetch: refetchProducts,
  } = useProductsPaginated(activeFilters);

  const products = productData?.data || [];

  /**
   * Calcula el stock disponible INTERNAMENTE
   * - Si validateStock = false: Infinity (cotizaciones, compras)
   * - Si mode = 'create': stock_actual
   * - Si mode = 'edit': stock_actual + cantidad_original
   */
  const getAvailableStock = useCallback((product: ProductGet): number => {
    if (!config.validateStock) {
      return Infinity; // Sin validación de stock
    }

    const stockActual = product.stock_actual ?? 0;
    const selectedItem = selectedItemsMap.get(product.id);

    if (config.mode === 'edit' && selectedItem) {
      // EDICIÓN: stock_actual + cantidad que ya estaba en la venta
      return stockActual + selectedItem.quantity;
    }

    // CREACIÓN: solo stock_actual
    return stockActual;
  }, [config.mode, config.validateStock, selectedItemsMap]);

  /**
   * Verifica si un producto está completamente agotado
   */
  // const isProductFullySelected = useCallback((product: ProductGet): boolean => {
  //   if (!config.validateStock) return false;

  //   const selectedItem = selectedItemsMap.get(product.id);
  //   if (!selectedItem) return false;

  //   const availableStock = getAvailableStock(product);
  //   if (availableStock === Infinity) return false;

  //   return selectedItem.quantity >= availableStock;
  // }, [config.validateStock, selectedItemsMap, getAvailableStock]);

  /**
   * Valida si se puede agregar un producto
   */
  const canAddProduct = useCallback((product: ProductGet): {
    canAdd: boolean;
    reason?: string;
    availableToAdd?: number;
    showStockInfo: boolean;
  } => {
    if (!config.validateStock) {
      return { canAdd: true, showStockInfo: false };
    }

    const stockActual = product.stock_actual ?? 0;

    if (stockActual <= 0 && config.mode === 'create') {
      return {
        canAdd: false,
        reason: 'Este producto no tiene stock disponible',
        availableToAdd: 0,
        showStockInfo: true
      };
    }

    const selectedItem = selectedItemsMap.get(product.id);
    const availableStock = getAvailableStock(product);

    if (selectedItem && availableStock !== Infinity) {
      if (selectedItem.quantity >= availableStock) {
        return {
          canAdd: false,
          reason: config.mode === 'edit'
            ? `Ya agregaste el máximo disponible (${availableStock} unidades total)`
            : `Ya agregaste todo el stock disponible (${stockActual} unidades)`,
          availableToAdd: 0,
          showStockInfo: true
        };
      }

      const remaining = availableStock - selectedItem.quantity;
      return {
        canAdd: true,
        availableToAdd: remaining,
        showStockInfo: true
      };
    }

    return {
      canAdd: true,
      availableToAdd: availableStock === Infinity ? undefined : availableStock,
      showStockInfo: true
    };
  }, [config.mode, config.validateStock, selectedItemsMap, getAvailableStock]);

  const {
    isProductSelected,
    toggleProductSelection,
    getAllSelectedProducts,
    getSelectedCount,
    clearAllSelections,
  } = useProductSelection();

  const [quantities, setQuantities] = useState<Map<number, number>>(new Map());

  const handleProductSelect = useCallback(
    async (product: ProductGet) => {
      const validation = canAddProduct(product);

      if (!validation.canAdd) {
        showErrorToast({
          title: 'No se puede agregar',
          description: validation.reason || 'No disponible',
          duration: 3000
        });
        return;
      }

      if (isMultiSelect) {
        toggleProductSelection(product);

        if (!quantities.has(product.id)) {
          setQuantities(prev => new Map(prev).set(product.id, 1));
        }

        if (!showSelectionPanel) {
          setShowSelectionPanel(true);
        }

        const selectedItem = selectedItemsMap.get(product.id);
        if (selectedItem) {
          showSuccessToast({
            title: 'Producto en carrito',
            description: `${product.descripcion} (${selectedItem.quantity} en carrito actual)`,
            duration: 2000
          });
        } else {
          showSuccessToast({
            title: 'Producto agregado',
            description: product.descripcion,
            duration: 2000
          });
        }
      } else {
        showSuccessToast({
          title: 'Producto seleccionado',
          description: product.descripcion,
          duration: 1500
        });

        await emitToWindow(config.windowId, 'product-selected', product);
        await currentWindow.close();
      }
    },
    [
      isMultiSelect,
      toggleProductSelection,
      quantities,
      config.windowId,
      currentWindow,
      showSelectionPanel,
      canAddProduct,
      selectedItemsMap
    ]
  );

  const handleRemoveFromSelection = useCallback((product: ProductGet) => {
    toggleProductSelection(product);
    setQuantities(prev => {
      const newMap = new Map(prev);
      newMap.delete(product.id);
      return newMap;
    });

    showWarningToast({
      title: 'Producto removido',
      description: product.descripcion,
      duration: 2000
    });
  }, [toggleProductSelection]);

  const handleQuantityChange = useCallback((productId: number, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
      handleRemoveFromSelection(product);
      showWarningToast({
        title: 'Producto removido',
        description: product.descripcion,
        duration: 2000
      });
      return;
    }

    // Si NO valida stock, permitir cualquier cantidad
    if (!config.validateStock) {
      setQuantities(prev => new Map(prev).set(productId, newQuantity));
      return;
    }

    const selectedItem = selectedItemsMap.get(productId);
    const availableStock = getAvailableStock(product);
    const currentInCart = selectedItem?.quantity || 0;

    const maxCanAdd = availableStock === Infinity
      ? Infinity
      : availableStock - currentInCart;

    if (maxCanAdd !== Infinity && newQuantity > maxCanAdd) {
      showErrorToast({
        title: 'Stock insuficiente',
        description: config.mode === 'edit'
          ? `Solo puedes agregar ${maxCanAdd} más (máximo total: ${availableStock})`
          : `Solo puedes agregar ${maxCanAdd} más (stock actual: ${product.stock_actual})`,
        duration: 4000,
      });
      return;
    }

    if (maxCanAdd !== Infinity && newQuantity === maxCanAdd) {
      showWarningToast({
        title: 'Máximo alcanzado',
        description: `Has alcanzado el límite para este producto`,
        duration: 3000,
      });
    }

    setQuantities(prev => new Map(prev).set(productId, newQuantity));
  }, [
    products,
    getAvailableStock,
    selectedItemsMap,
    handleRemoveFromSelection,
    config.mode,
    config.validateStock
  ]);

  const handleClearSelection = useCallback(() => {
    const count = getSelectedCount();
    if (count === 0) return;

    clearAllSelections();
    setQuantities(new Map());

    showWarningToast({
      title: 'Selección limpiada',
      description: `${count} producto${count !== 1 ? 's' : ''} removido${count !== 1 ? 's' : ''}`,
      duration: 2000
    });
  }, [getSelectedCount, clearAllSelections]);

  const handleConfirmMultiSelect = async () => {
    const selectedProducts = getAllSelectedProducts();

    if (selectedProducts.length === 0) {
      showErrorToast({
        title: 'Sin productos',
        description: 'No has seleccionado ningún producto',
        duration: 3000
      });
      return;
    }

    // Validar cada producto antes de confirmar
    const invalidProducts: string[] = [];
    const productsWithQuantities = selectedProducts.map(product => {
      const quantity = quantities.get(product.id) || 1;
      const validation = canAddProduct(product);

      if (!validation.canAdd || (validation.availableToAdd !== undefined && quantity > validation.availableToAdd)) {
        invalidProducts.push(
          `${product.descripcion} (máx: ${validation.availableToAdd || 0})`
        );
      }

      return {
        ...product,
        quantity,
      };
    });

    if (invalidProducts.length > 0) {
      showErrorToast({
        title: 'Productos con cantidad inválida',
        description: invalidProducts.join(', '),
        duration: 5000
      });
      return;
    }

    showSuccessToast({
      title: 'Productos confirmados',
      description: `${selectedProducts.length} producto${selectedProducts.length !== 1 ? 's' : ''} agregado${selectedProducts.length !== 1 ? 's' : ''}`,
      duration: 2000
    });

    await emitToWindow(
      config.windowId,
      'product-multi-selected',
      productsWithQuantities
    );

    await currentWindow.close();
  };

  const getStockColor = (stock: number, stock_min: number) => {
    const stockMin: number = stock_min || 10;
    if (stock <= stockMin) return 'danger';
    if (stock <= stockMin + 10) return 'warning';
    return 'success';
  };

  const columns = useMemo<ColumnDef<ProductGet>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Cód.',
        enableSorting: true,
        enableHiding: true,
        size: 60,
        minSize: 40,
        cell: ({ getValue }) => {
          const id = getValue<number>();
          return <div className="text-center font-medium">{id}</div>;
        },
      },
      {
        accessorKey: 'descripcion',
        header: 'Producto',
        size: 300,
        minSize: 30,
        enableHiding: false,
        cell: ({ getValue }) => (
          <div className="flex flex-col">
            <h3 className="font-medium text-primary leading-tight truncate">
              {getValue<string>()}
            </h3>
          </div>
        ),
      },
      {
        accessorKey: 'codigo_oem',
        header: 'Cód. OEM',
        size: 135,
        minSize: 30,
        cell: ({ getValue }) => (
          <div className="flex items-center justify-center">
            <Badge
              className="rounded font-normal w-full flex justify-center items-center"
              variant="secondary"
            >
              {formatCell(getValue<string>())}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'codigo_upc',
        header: 'Cód. UPC',
        size: 115,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="flex items-center justify-center">
            <span>{formatCell(getValue<string>())}</span>
          </div>
        ),
      },
      {
        accessorKey: 'precio_venta',
        header: 'Precio',
        size: 120,
        minSize: 100,
        cell: ({ row, getValue }) => {
          const precioAlt = row.original.precio_venta_alt;
          return (
            <div className="space-y-1 flex items-end flex-col">
              <div className="font-bold text-green-600">
                {formatCurrency(getValue<number>())}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">
                  Alt: {formatCurrency(precioAlt)}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'stock_actual',
        header: 'Stock',
        size: 110,
        minSize: 100,
        cell: ({ row }) => {
          const stock = typeof row.original.stock_actual === "string"
            ? parseFloat(row.original.stock_actual)
            : row.original.stock_actual;
          const stockDisplay = isFinite(stock) ? stock.toFixed(0) : "0";
          const stockMin = row.original.stock_minimo || 1;

          return (
            <Badge
              variant={getStockColor(stock, stockMin)}
              className="flex flex-col justify-center rounded"
            >
              <span className="font-bold">{stockDisplay}</span>
              <span className="text-[10px] uppercase">
                {row.original.unidad_medida}
              </span>
            </Badge>
          );
        },
      },
      {
        accessorKey: 'marca',
        header: 'Marca',
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: 'categoria',
        header: 'Categoría',
        size: 150,
        minSize: 120,
        cell: ({ row, getValue }) => (
          <div className="space-y-1">
            <span className="text-blue-600 font-medium">
              {getValue<string>()}
            </span>
            <div className="text-gray-500">{row.original.subcategoria}</div>
          </div>
        ),
      },
      {
        id: 'acciones',
        header: 'Acción',
        size: 170,
        minSize: 150,
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          const selected = isProductSelected(product.id);
          const selectedItem = selectedItemsMap.get(product.id);
          const validation = canAddProduct(product);

          let buttonText = 'Seleccionar';
          let buttonVariant: 'default' | 'outline' | 'secondary' = 'outline';
          let icon = <Plus className="h-4 w-4" />;
          let tooltipText = '';

          if (!validation.canAdd) {
            buttonText = 'No disponible';
            buttonVariant = 'secondary';
            icon = <X className="h-4 w-4 hidden" />;
            tooltipText = validation.reason || 'No disponible';
          } else if (selectedItem) {
            buttonText = `En carrito (${selectedItem.quantity})`;
            buttonVariant = 'default';
            icon = <Check className="h-4 w-4" />;

            if (validation.availableToAdd !== undefined) {
              tooltipText = `Puedes agregar ${validation.availableToAdd} más`;
            }
          } else if (selected) {
            buttonText = 'Seleccionado';
            buttonVariant = 'default';
            icon = <Check className="h-4 w-4" />;
          }

          return (
            <div className="flex flex-col items-center gap-0.5">
              <TooltipButton
                onClick={() => handleProductSelect(product)}
                buttonProps={{
                  disabled: !validation.canAdd,
                  variant: buttonVariant,
                  className: 'gap-2 w-full',
                }}
                tooltip={tooltipText || undefined}
              >
                {icon}
                <span className="truncate">{buttonText}</span>
              </TooltipButton>

              {/* Info de stock */}
              {validation.showStockInfo && selectedItem && validation.availableToAdd !== undefined && (
                <span className={`text-[10px] ${validation.availableToAdd === 0
                  ? 'text-red-600 font-semibold'
                  : validation.availableToAdd <= 3
                    ? 'text-orange-600'
                    : 'text-gray-500'
                  }`}>
                  {validation.availableToAdd === 0
                    ? 'Máximo alcanzado'
                    : `+${validation.availableToAdd} disponible${validation.availableToAdd !== 1 ? 's' : ''}`
                  }
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [
      config.validateStock,
      handleProductSelect,
      isProductSelected,
      selectedItemsMap,
      canAddProduct,
    ]
  );

  const { table } = useCustomTable({
    data: products,
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: false,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,
    columnResizeMode: 'onChange',
    persistenceKey: `product-selector-${config.context}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const {
    selectedIndex,
    setSelectedIndex,
    isFocused,
  } = useKeyboardNavigation<ProductGet, HTMLTableElement>({
    items: products,
    containerRef: tableRef,
    onPrimaryAction: (product) => {
      handleProductSelect(product)
    },
    onSecondaryAction: () => { },
    onDeleteAction: () => { },
    getItemId: (product) => product.id
  });

  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleRowDoubleClick = (product: ProductGet) => {
    handleProductSelect(product);
  };

  const handleClose = async () => {
    await emitToWindow(config.windowId, 'window-closed', { canceled: true });
    await currentWindow.close();
  };

  const onPageChange = (page: number) => {
    setPage(page);
  };

  const onShowRowsChange = (rows: number) => {
    setPageSize(rows);
  };

  const handleRefetchProducts = () => {
    refetchProducts();
  };

  const toggleShowFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleManualSearch = () => {
    if (searchMode === 'manual') {
      applyFilters();
    }
    saveFilters();
  };

  const handleResetFilters = () => {
    resetFilters()
    localStorage.removeItem(STORAGE_KEY);
  }

  const toggleSearchMode = () => {
    setSearchMode(prev => (prev === 'realtime' ? 'manual' : 'realtime'));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalSelectedProducts = getAllSelectedProducts().reduce(
    (sum, p) => sum + (quantities.get(p.id) || 1),
    0
  );

  const contextTitle = useMemo(() => {
    const titles: Record<string, string> = {
      purchase: 'Agregar a Compra',
      sale: 'Agregar a Venta',
      quote: 'Agregar a Cotización',
      transfer: 'Agregar a Transferencia',
      inventory: 'Seleccionar Productos',
    };

    const title = titles[config.context] || 'Seleccionar Productos';
    return title;
  }, [config.context]);

  useCommands({
    'searchFilters.focusSearch': handleManualSearch,
    'forms.reset': handleResetFilters
  })

  return (
    <main className="h-full p-2 flex flex-col bg-gray-50 gap-2">
      {/* Header */}
      <header className="bg-background rounded-lg p-2 border border-border flex-shrink-0 flex flex-col divide-y divide-border gap-1">
        <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap pb-2">
          <div className="flex items-center gap-2 md:gap-4 grow">
            <Package className="h-5 w-5 text-primary" />
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-primary">
                {contextTitle}
              </h1>
              {/* Badges de modo y validación */}
              <Badge variant={config.mode === 'edit' ? 'default' : 'secondary'}>
                {config.mode === 'edit' ? 'Editando' : 'Nuevo'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isMultiSelect && getSelectedCount() > 0 && (
              <Badge variant="accent">
                {totalSelectedProducts} seleccionados
              </Badge>
            )}

            <Button
              variant="ghost"
              onClick={toggleSearchMode}
              className="text-xs h-7"
              title={
                searchMode === 'realtime'
                  ? 'Cambiar a búsqueda manual'
                  : 'Cambiar a búsqueda en tiempo real'
              }
            >
              <Zap
                className={`h-3 w-3 ${searchMode === 'realtime'
                  ? 'text-yellow-500'
                  : 'text-gray-500'
                  }`}
              />
              {searchMode === 'realtime' ? 'Tiempo real' : 'Manual'}
            </Button>

            <TooltipButton
              onClick={handleRefetchProducts}
              buttonProps={{
                className: 'w-8',
                disabled: isFetching,
              }}
              tooltip="Recargar productos"
            >
              <RefreshCcw
                className={`size-4 ${isFetching ? 'animate-spin' : ''}`}
              />
            </TooltipButton>

            <Button variant={'outline'} onClick={toggleShowFilters}>
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>

            <Button onClick={handleResetFilters}>
              <PackageSearch className="h-4 w-4" />
              Nueva búsqueda
            </Button>

            {isMultiSelect && getSelectedCount() > 0 && (
              <Button
                onClick={handleConfirmMultiSelect}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Confirmar Selección
              </Button>
            )}
          </div>
        </section>
        {showFilters && (
          <ProductFilters
            filters={filters}
            updateFilter={updateFilter}
            showSubcategories={false}
            handleManualSearch={handleManualSearch}
            searchMode={searchMode}
          />
        )}
      </header>

      <div className='bg-background rounded-lg border border-border flex-1 min-h-0'>
        <div className="h-full flex flex-col">
          {/* Results Info */}
          <div className="p-2 text-sm text-gray-600 border-b border-border flex-shrink-0 flex items-center justify-between">
            {products.length > 0 ? (
              (() => {
                const pagina = filters.pagina ?? 1;
                const porPagina = filters.pagina_registros ?? 1;
                const inicio = (pagina - 1) * porPagina + 1;
                const fin = pagina * porPagina;
                return `Mostrando ${inicio} - ${fin} de ${productData?.meta.total} productos`;
              })()
            ) : (
              <span>Cargando...</span>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {config.multiSelect && (
                <div className='border border-border rounded-sm gap-2 flex items-center px-2 h-8'>
                  <Switch
                    id='multi-select'
                    checked={isMultiSelect}
                    onCheckedChange={setIsMultiSelect}
                  />
                  <Label htmlFor='multi-select'>Selección múltiple</Label>
                </div>
              )}
              <ColumnVisibilityDropdown table={table} />
            </div>
          </div>

          {/* Tabla con scroll */}
          <div className="flex-1 min-h-0">
            <CustomizableTable
              table={table}
              isError={isError}
              isFetching={isFetching}
              isLoading={isLoading}
              errorMessage="Ocurrió un error al cargar los productos"
              rows={filters.pagina_registros}
              noDataMessage="No se encontraron productos"
              keyboardNavigationEnabled={true}
              enableColumnReordering={true}
              tableRef={tableRef}
              enableSorting={false}
              selectedRowIndex={selectedIndex}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              focused={isFocused}
            />
          </div>

          {/* Paginación */}
          {(productData?.data?.length ?? 0) > 0 && (
            <Pagination
              currentPage={filters.pagina || 1}
              onPageChange={onPageChange}
              totalData={productData?.meta.total || 1}
              onShowRowsChange={onShowRowsChange}
              showRows={filters.pagina_registros}
            />
          )}
        </div>
      </div>

      {/* Panel lateral mejorado */}
      {isMultiSelect && showSelectionPanel && getSelectedCount() > 0 && (
        <div className="fixed right-4 bottom-4 w-80 sm:w-96 max-h-[32rem] bg-card rounded-lg shadow-2xl border-2 border-border overflow-hidden z-50">
          <div className="bg-primary/10 px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-primary">
                Productos para Agregar ({getSelectedCount()})
              </h3>
              <p className="text-xs text-gray-600">
                Total unidades: {totalSelectedProducts}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {getSelectedCount() > 1 && (
                <TooltipButton
                  onClick={handleClearSelection}
                  buttonProps={{
                    variant: 'ghost',
                    className: 'h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                  }}
                  tooltip="Limpiar selección"
                >
                  <Trash2 className="h-4 w-4" />
                </TooltipButton>
              )}
              <Button
                variant="ghost"
                onClick={() => setShowSelectionPanel(false)}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-80 divide-y divide-border">
            {getAllSelectedProducts().map(product => {
              const quantity = quantities.get(product.id) || 1;
              const selectedItem = selectedItemsMap.get(product.id);
              const validation = canAddProduct(product);
              const maxCanAdd = validation.availableToAdd ?? Infinity;

              const hasWarning = maxCanAdd !== Infinity && quantity >= maxCanAdd;
              const isAtLimit = quantity === maxCanAdd;

              return (
                <div
                  key={product.id}
                  className={`p-2 hover:bg-gray-50 ${hasWarning ? 'bg-orange-50/50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">
                        {product.descripcion}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500 font-mono">
                          {product.codigo_oem || 'Sin código'}
                        </p>
                        {selectedItem && (
                          <Badge variant="secondary" className="text-xs py-0">
                            {selectedItem.quantity} en carrito
                          </Badge>
                        )}
                      </div>

                      {/* Advertencias */}
                      {config.validateStock && hasWarning && (
                        <p className={`text-xs mt-1 font-medium ${isAtLimit ? 'text-red-600' : 'text-orange-600'
                          }`}>
                          {isAtLimit
                            ? '⚠️ Máximo alcanzado'
                            : `⚠️ Cerca del límite (máx: ${maxCanAdd})`
                          }
                        </p>
                      )}

                      {config.validateStock && config.mode === 'edit' && validation.availableToAdd !== undefined && (
                        <p className="text-xs text-gray-600 mt-1">
                          Disponible para agregar: {validation.availableToAdd}
                        </p>
                      )}
                    </div>

                    {/* Control de cantidad */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => handleQuantityChange(product.id, quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="text-sm font-semibold w-10 text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        className={`h-7 w-7 p-0 ${config.validateStock && isAtLimit ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        onClick={() => handleQuantityChange(product.id, quantity + 1)}
                        disabled={config.validateStock && isAtLimit}
                        title={config.validateStock && isAtLimit ? 'Máximo alcanzado' : 'Agregar más'}
                      >
                        +
                      </Button>
                    </div>

                    {/* Botón eliminar */}
                    <TooltipButton
                      onClick={() => handleRemoveFromSelection(product)}
                      buttonProps={{
                        variant: 'ghost',
                        className: 'h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                      }}
                      tooltip="Remover producto"
                    >
                      <X className="h-4 w-4" />
                    </TooltipButton>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total a agregar:</span>
              <span className="font-bold text-primary">
                {totalSelectedProducts} unidad{totalSelectedProducts !== 1 ? 'es' : ''}
              </span>
            </div>

            <Button
              onClick={handleConfirmMultiSelect}
              className="w-full gap-2"
            >
              <Check className="h-4 w-4" />
              Confirmar Selección
            </Button>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProductSelectorWindow;