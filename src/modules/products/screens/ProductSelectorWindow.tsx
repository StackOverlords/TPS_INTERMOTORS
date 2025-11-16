/**
 * ProductSelectorWindow - Ventana Standalone para Selección de Productos
 *
 * Usa la misma estructura visual y filtros que ProductListScreen
 */

import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Checkbox } from '@/components/atoms/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
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
  Settings,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProductSelection } from '../hooks/useProductSelection';

type ProductSelectorContext =
  | 'purchase'
  | 'sale'
  | 'transfer'
  | 'sale-edit'
  | 'purchase-edit'
  | 'inventory'
  | string; // Permitir contextos personalizados

interface WindowConfig {
  windowId: string;
  context: ProductSelectorContext;
  onlyWithStock?: boolean;
  multiSelect?: boolean;
  initialFilters?: Record<string, any>;
}

const ProductSelectorWindow: React.FC = () => {
  const currentWindow = getCurrentWebviewWindow();
  const selectedBranchId = useBranchStore(s => s.selectedBranchId);
  const tableRef = useRef<HTMLTableElement>(null);

  // Extraer configuración de query params
  const config: WindowConfig = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      windowId: params.get('windowId') || 'product-selector-default',
      context: params.get('context') || 'default',
      onlyWithStock: params.get('onlyWithStock') === 'true',
      multiSelect: params.get('multiSelect') === 'true',
    };
  }, []);

  const [isMultiSelect, setIsMultiSelect] = useState<boolean>(false)

  // Estados
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);
  const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>('manual');
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // Filtros de productos
  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    setPage,
    applyFilters,
    setPageSize,
  } = useProductFilters(Number(selectedBranchId) || 1);

  const activeFilters =
    searchMode === 'realtime' ? debouncedFilters : appliedFilters;

  // Query de productos
  const {
    data: productData,
    isLoading,
    isFetching,
    isError,
    refetch: refetchProducts,
  } = useProductsPaginated(activeFilters);

  const products = productData?.data || [];

  // Función para determinar el color del stock
  const getStockColor = (stock: number, stock_min: number) => {
    const stockMin: number = stock_min || 10;
    if (stock <= stockMin) return 'danger';
    if (stock <= stockMin + 10) return 'warning';
    return 'success';
  };

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
      if (isMultiSelect) {
        // Modo multi-select: agregar a lista
        toggleProductSelection(product);

        // Inicializar cantidad si no existe
        if (!quantities.has(product.id)) {
          setQuantities(prev => new Map(prev).set(product.id, 1));
        }

        // Mostrar panel de selección si está oculto
        if (!showSelectionPanel) {
          setShowSelectionPanel(true);
        }
      } else {
        // Modo single-select: emitir inmediatamente y cerrar
        await emitToWindow(config.windowId, 'product-selected', product);
        await currentWindow.close();
      }
    },
    [isMultiSelect, toggleProductSelection, quantities, config.windowId, currentWindow, showSelectionPanel]
  );

  const handleRemoveFromSelection = useCallback((product: ProductGet) => {
    toggleProductSelection(product);
    setQuantities(prev => {
      const newMap = new Map(prev);
      newMap.delete(product.id);
      return newMap;
    });
  }, [toggleProductSelection]);

  const handleQuantityChange = useCallback((productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      const product = getAllSelectedProducts().find(p => p.id === productId);
      if (product) {
        handleRemoveFromSelection(product);
      }
      return;
    }

    setQuantities(prev => new Map(prev).set(productId, newQuantity));
  }, [getAllSelectedProducts, handleRemoveFromSelection]);

  /**
   * Confirma la multi-selección y envía todos los productos
   */
  const handleConfirmMultiSelect = async () => {
    const selectedProducts = getAllSelectedProducts();

    if (selectedProducts.length === 0) return;

    // Emitir evento con productos y sus cantidades
    const productsWithQuantities = selectedProducts.map(product => ({
      ...product,
      quantity: quantities.get(product.id) || 1,
    }));

    await emitToWindow(
      config.windowId,
      'product-multi-selected',
      productsWithQuantities
    );

    await currentWindow.close();
  };


  /**
   * Definición de columnas (similar a ProductListScreen)
   */
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
        size: 130,
        minSize: 100,
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          const selected = isProductSelected(product.id);
          const disabled = config.onlyWithStock && product.stock_actual <= 0;

          return (
            <div className="flex items-center justify-center">
              <Button
                onClick={() => handleProductSelect(product)}
                disabled={disabled}

                variant={selected ? 'default' : 'outline'}
                className="gap-2"
              >
                {selected ? (
                  <>
                    <Check className="h-4 w-4" />
                    Seleccionado
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Seleccionar
                  </>
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [
      config.onlyWithStock,
      getStockColor,
      handleProductSelect,
      isProductSelected,
    ]
  );

  /**
   * Tabla customizable setup
   */
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
    // hotkeys
  } = useKeyboardNavigation<ProductGet, HTMLTableElement>({
    items: products,
    containerRef: tableRef,
    onPrimaryAction: (product) => {
      handleProductSelect(product)
    },
    onSecondaryAction: (product) => {
      // addItemToCart(product);
    },
    onDeleteAction: (product) => {
      // decrementQuantity(product.id)
    },
    getItemId: (product) => product.id
  });
  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleRowDoubleClick = (product: ProductGet) => {
    // addItemToCart(product);
  };

  /**
   * Cierra la ventana
   */
  const handleClose = async () => {
    // Emitir evento de cancelación (opcional)
    await emitToWindow(config.windowId, 'window-closed', { canceled: true });
    await currentWindow.close();
  };

  /**
   * Manejo de paginación y filtros
   */
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
  };

  const toggleSearchMode = () => {
    setSearchMode(prev => (prev === 'realtime' ? 'manual' : 'realtime'));
  };

  /**
   * Listener para eventos de teclado (Escape para cerrar)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calcular total de productos seleccionados
  const totalSelectedProducts = getAllSelectedProducts().reduce(
    (sum, p) => sum + (quantities.get(p.id) || 1),
    0
  );

  // Título contextual || En que vista usaremos esto:
  const contextTitle = useMemo(() => {
    const titles: Record<string, string> = {
      purchase: 'Agregar a Compra',
      sale: 'Agregar a Venta',
      transfer: 'Agregar a Transferencia',
      'sale-edit': 'Agregar a Venta',
      'purchase-edit': 'Agregar a Compra',
      inventory: 'Seleccionar Productos',
    };
    return titles[config.context] || 'Seleccionar Productos';
  }, [config.context]);

  return (
    <main className="h-full p-2 flex flex-col bg-gray-50 gap-2">
      {/* Header */}
      <header className="bg-background rounded-lg p-2 border border-border flex-shrink-0 flex flex-col divide-y divide-border gap-1">
        <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2 md:gap-4 grow">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-primary">
                {contextTitle}
              </h1>
              <p className="text-xs text-gray-500">
                Contexto: <span className="font-mono">{config.context}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Indicador de multi-select */}
            {isMultiSelect && getSelectedCount() > 0 && (
              <Badge variant="accent">
                {totalSelectedProducts} seleccionados
              </Badge>
            )}

            {/* Toggle de modo de búsqueda */}
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

            <Button onClick={toggleShowFilters}>
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>

            {/* Botón confirmar (solo en multi-select) */}
            {isMultiSelect && getSelectedCount() > 0 && (
              <Button
                onClick={handleConfirmMultiSelect}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Confirmar Selección
              </Button>
            )}

            {/* Botón cerrar */}
            {/* <Button
                  onClick={handleClose}
                  variant="ghost"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cerrar
                </Button> */}
          </div>
        </section>
        {/* Búsquedas individuales */}
        {
          showFilters &&
          <ProductFilters
            filters={filters}
            updateFilter={updateFilter}
            showSubcategories={false}
            handleManualSearch={handleManualSearch}
            searchMode={searchMode}
          />
        }
      </header>

      <div className='bg-background rounded-lg border border-border flex-1 min-h-0'>
        <div className="h-full flex flex-col">
          {/* Results Info */}
          <div className="p-2 text-sm text-gray-600 border-b border-border flex-shrink-0 flex items-center justify-between">
            {
              products.length > 0 ? (
                (() => {
                  const pagina = filters.pagina ?? 1;
                  const porPagina = filters.pagina_registros ?? 1;

                  const inicio = (pagina - 1) * porPagina + 1;
                  const fin = pagina * porPagina;

                  return `Mostrando ${inicio} - ${fin} de ${productData?.meta.total} productos`;
                })()
              ) : (
                <span>Cargando...</span>
              )
            }

            <div className="flex items-center gap-2 flex-wrap">
              {
                config.multiSelect && (
                  <div className='border border-border rounded-sm gap-2 flex items-center px-2 h-8'>
                    <Switch
                      id='multi-select'
                      checked={isMultiSelect}
                      onCheckedChange={setIsMultiSelect}
                    />
                    <Label htmlFor='multi-select'>Selección multiple</Label>
                  </div>
                )
              }
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings className="w-4 h-4" />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto border border-border">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuItem
                        key={column.id}
                        className="flex items-center space-x-2 cursor-pointer"
                        onSelect={(e) => e.preventDefault()}
                        onClick={() => column.toggleVisibility(!column.getIsVisible())}
                      >
                        <Checkbox
                          className="border border-gray-400"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        />
                        <span className="flex-1">
                          {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                        </span>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* CONTENEDOR CON SCROLL - Solo esta parte tiene scroll */}
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
              enableSorting={false} //pendiente para usar configuraciones
              selectedRowIndex={selectedIndex}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              focused={isFocused}
            />
          </div>
          {/* Pagination - FIJO en la parte inferior */}
          {
            (productData?.data?.length ?? 0) > 0 && (
              <Pagination
                currentPage={filters.pagina || 1}
                onPageChange={onPageChange}
                totalData={productData?.meta.total || 1}
                onShowRowsChange={onShowRowsChange}
                showRows={filters.pagina_registros}
              />
            )
          }
        </div>
      </div>

      {/* Panel lateral de productos seleccionados (solo multi-select) */}
      {isMultiSelect &&
        showSelectionPanel &&
        getSelectedCount() > 0 && (
          <div className="fixed right-4 bottom-4 w-80 sm:w-96 max-h-96 bg-card rounded-lg shadow-2xl border border-border overflow-hidden z-50">
            <div className="bg-gray-100 px-4 py-2 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-primary">
                Productos Seleccionados ({getSelectedCount()})
              </h3>
              <Button
                variant="ghost"
                onClick={() => setShowSelectionPanel(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-64 divide-y divide-border">
              {getAllSelectedProducts().map(product => {
                const quantity = quantities.get(product.id) || 1;
                return (
                  <div
                    key={product.id}
                    className="p-3 flex items-center gap-3 hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary truncate">
                        {product.descripcion}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {product.codigo_oem}
                      </p>
                    </div>

                    {/* Control de cantidad */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          handleQuantityChange(product.id, quantity - 1)
                        }
                      >
                        -
                      </Button>
                      <span className="text-sm font-semibold w-8 text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          handleQuantityChange(product.id, quantity + 1)
                        }
                        disabled={
                          config.onlyWithStock &&
                          quantity >= product.stock_actual
                        }
                      >
                        +
                      </Button>
                    </div>

                    {/* Botón eliminar */}
                    <Button
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveFromSelection(product)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>

            {/* Footer con botón confirmar */}
            <div className="bg-gray-50 px-4 py-3 border-t border-border">
              <Button
                onClick={handleConfirmMultiSelect}
                className="w-full gap-2"
              >
                <Check className="h-4 w-4" />
                Confirmar {totalSelectedProducts} producto
                {totalSelectedProducts !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
    </main>
  );
};

export default ProductSelectorWindow;
