/**
 * ProductSelectorWindow - Ventana Standalone para Selección de Productos
 * Con validación de stock configurable y cálculo interno
 * Layout: ResizablePanelGroup vertical — tabla productos (70%) + tabla seleccionados (30%)
 */

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/resizable";
import { Switch } from "@/components/atoms/switch";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import TooltipButton from "@/components/common/TooltipButton";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";
import { useCustomTable } from "@/hooks/useCustomTable";
import ProductFilters from "@/modules/products/components/productList/productFilters";
import { useProductsPaginated } from "@/modules/products/hooks/queries/useProductsPaginated";
import { useProductFilters } from "@/modules/products/hooks/useProductFilters";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import { useBranchStore } from "@/states/branchStore";
import { formatCell } from "@/utils/formatCell";
import { formatCurrency } from "@/utils/formaters";
import { getWindowManager } from "@/platform";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Check,
  Package,
  Plus,
  RefreshCcw,
  X,
  Zap,
  Trash2,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProductSelection } from "../hooks/useProductSelection";
import type { SelectedItem } from "@/types/windowSelectedItems";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "@/hooks/use-toast-enhanced";
import { ColumnVisibilityDropdown } from "@/components/common/ColumnVisibilityDropdown";
import { useCommands } from "@/keybindings";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";

type ProductSelectorContext =
  | "purchase"
  | "sale"
  | "transfer"
  | "quote"
  | "inventory"
  | string;

interface WindowConfig {
  windowId: string;
  context: ProductSelectorContext;
  multiSelect: boolean;
  mode: "create" | "edit";
  validateStock: boolean;
  selectedItems: SelectedItem[];
  initialFilters?: Record<string, any>;
  simpleMode: boolean;
}

const ProductSelectorWindow: React.FC = () => {
  const platformWindows = getWindowManager();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const queryClient = useQueryClient();

  // Siempre invalidar cache de productos al montar la ventana.
  // Esto evita que un error cacheado de React Query (staleTime: 5min) persista
  // cuando la ventana es reutilizada por Tauri sin destruir el WebView.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }, []);
  const tableRef = useRef<HTMLTableElement>(null);

  const config: WindowConfig = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    const selectedItemsParam = params.get("selectedItems");
    let selectedItems: SelectedItem[] = [];
    if (selectedItemsParam) {
      try {
        selectedItems = JSON.parse(selectedItemsParam);
      } catch (e) {
        console.error("Error parsing selectedItems:", e);
      }
    }

    return {
      windowId: params.get("windowId") || "product-selector-default",
      context: params.get("context") || "default",
      multiSelect: params.get("multiSelect") === "true",
      mode: (params.get("mode") as "create" | "edit") || "create",
      validateStock: params.get("validateStock") !== "false",
      simpleMode: params.get("simpleMode") === "true",
      selectedItems,
    };
  }, []);

  const STORAGE_KEY = config.windowId + "-product-filters";
  const FILTER_EXPIRATION_HOURS = 2;
  const [isMultiSelect, setIsMultiSelect] = useState<boolean>(false);
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const hasLoadedFilters = useRef(false);

  // Map de items seleccionados para búsqueda rápida
  const selectedItemsMap = useMemo(() => {
    const map = new Map<number, SelectedItem>();
    config.selectedItems.forEach((item) => {
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
  } = useProductFilters(Number(selectedBranchId) || 1, 10);

  const activeFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  // Cargar filtros persistidos al montar
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && !hasLoadedFilters.current) {
          const { filters: parsed, timestamp } = JSON.parse(saved);

          const now = Date.now();
          const expirationTime = FILTER_EXPIRATION_HOURS * 60 * 60 * 1000;

          if (now - timestamp > expirationTime) {
            localStorage.removeItem(STORAGE_KEY);
            return;
          }

          setFilters({
            pagina: parsed.pagina ?? 1,
            pagina_registros: parsed.pagina_registros ?? 10,
            sucursal: parsed.sucursal ?? 0,
            descripcion: parsed.descripcion || "",
            codigo_oem: parsed.codigo_oem || "",
            codigo_upc: parsed.codigo_upc || "",
            categoria: parsed.categoria || 0,
            marca: parsed.marca || "",
            medida: parsed.medida || "",
            nro_motor: parsed.nro_motor || "",
            modelo: parsed.modelo || "",
            producto: parsed.producto || 0,
            subcategoria: parsed.subcategoria || 0,
          });
          hasLoadedFilters.current = true;
        }
      } catch (e) {
        console.error("Error loading filters:", e);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    if (hasLoadedFilters.current && searchMode === "manual") {
      const timer = setTimeout(() => {
        applyFilters();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [hasLoadedFilters.current]);

  const saveFilters = useCallback(() => {
    try {
      const dataToSave = {
        filters: filters,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Error saving filters:", e);
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
   */
  const getAvailableStock = useCallback(
    (product: ProductGet): number => {
      if (!config.validateStock) {
        return Infinity;
      }

      const stockActual = product.stock_actual ?? 0;
      const selectedItem = selectedItemsMap.get(product.id);

      if (config.mode === "edit" && selectedItem) {
        return stockActual + selectedItem.quantity;
      }

      return stockActual;
    },
    [config.mode, config.validateStock, selectedItemsMap]
  );

  /**
   * Valida si se puede agregar un producto
   */
  const canAddProduct = useCallback(
    (
      product: ProductGet
    ): {
      canAdd: boolean;
      reason?: string;
      availableToAdd?: number;
      showStockInfo: boolean;
    } => {
      if (!config.validateStock) {
        return { canAdd: true, showStockInfo: false };
      }

      const stockActual = product.stock_actual ?? 0;

      if (stockActual <= 0 && config.mode === "create") {
        return {
          canAdd: false,
          reason: "Este producto no tiene stock disponible",
          availableToAdd: 0,
          showStockInfo: true,
        };
      }

      const selectedItem = selectedItemsMap.get(product.id);
      const availableStock = getAvailableStock(product);

      if (selectedItem && availableStock !== Infinity) {
        if (selectedItem.quantity >= availableStock) {
          return {
            canAdd: false,
            reason:
              config.mode === "edit"
                ? `Ya agregaste el máximo disponible (${availableStock} unidades total)`
                : `Ya agregaste todo el stock disponible (${stockActual} unidades)`,
            availableToAdd: 0,
            showStockInfo: true,
          };
        }

        const remaining = availableStock - selectedItem.quantity;
        return {
          canAdd: true,
          availableToAdd: remaining,
          showStockInfo: true,
        };
      }

      return {
        canAdd: true,
        availableToAdd:
          availableStock === Infinity ? undefined : availableStock,
        showStockInfo: true,
      };
    },
    [config.mode, config.validateStock, selectedItemsMap, getAvailableStock]
  );

  const {
    isProductSelected,
    toggleProductSelection,
    getAllSelectedProducts,
    getSelectedCount,
    clearAllSelections,
  } = useProductSelection();

  const [quantities, setQuantities] = useState<Map<number, number>>(new Map());

  // Mapa de productos seleccionados para no depender de la pagina paginada actual
  const [selectedProductsMap, setSelectedProductsMap] = useState<
    Map<number, ProductGet>
  >(new Map());

  const handleProductSelect = useCallback(
    async (product: ProductGet) => {
      const validation = canAddProduct(product);

      if (!validation.canAdd) {
        showErrorToast({
          title: "No se puede agregar",
          description: validation.reason || "No disponible",
          duration: 3000,
        });
        return;
      }

      if (isMultiSelect) {
        toggleProductSelection(product);

        if (!quantities.has(product.id)) {
          setQuantities((prev) => new Map(prev).set(product.id, 1));
          setSelectedProductsMap((prev) =>
            new Map(prev).set(product.id, product)
          );
        }

        const selectedItem = selectedItemsMap.get(product.id);
        if (selectedItem) {
          showSuccessToast({
            title: "Producto en carrito",
            description: `${product.descripcion} (${selectedItem.quantity} en carrito actual)`,
            duration: 2000,
          });
        } else {
          showSuccessToast({
            title: "Producto agregado",
            description: product.descripcion,
            duration: 2000,
          });
        }
      } else {
        showSuccessToast({
          title: "Producto seleccionado",
          description: product.descripcion,
          duration: 1500,
        });

        await platformWindows.emitToWindow(config.windowId, "product-selected", product).catch(() => {});
        await platformWindows.closeCurrentWindow();
      }
    },
    [
      isMultiSelect,
      toggleProductSelection,
      quantities,
      config.windowId,
      platformWindows,
      canAddProduct,
      selectedItemsMap,
    ]
  );

  const handleRemoveFromSelection = useCallback(
    (product: ProductGet) => {
      toggleProductSelection(product);
      setQuantities((prev) => {
        const newMap = new Map(prev);
        newMap.delete(product.id);
        return newMap;
      });
      setSelectedProductsMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(product.id);
        return newMap;
      });

      showWarningToast({
        title: "Producto removido",
        description: product.descripcion,
        duration: 2000,
      });
    },
    [toggleProductSelection]
  );

  const handleQuantityChange = useCallback(
    (productId: number, newQuantity: number) => {
      // Buscar en el mapa de seleccionados (no depende de la pagina actual)
      const product =
        selectedProductsMap.get(productId) ??
        products.find((p) => p.id === productId);
      if (!product) return;

      if (newQuantity <= 0) {
        handleRemoveFromSelection(product);
        return;
      }

      if (!config.validateStock) {
        setQuantities((prev) => new Map(prev).set(productId, newQuantity));
        return;
      }

      const selectedItem = selectedItemsMap.get(productId);
      const availableStock = getAvailableStock(product);
      const currentInCart = selectedItem?.quantity || 0;

      const maxCanAdd =
        availableStock === Infinity ? Infinity : availableStock - currentInCart;

      if (maxCanAdd !== Infinity && newQuantity > maxCanAdd) {
        showErrorToast({
          title: "Stock insuficiente",
          description:
            config.mode === "edit"
              ? `Solo puedes agregar ${maxCanAdd} mas (maximo total: ${availableStock})`
              : `Solo puedes agregar ${maxCanAdd} mas (stock actual: ${product.stock_actual})`,
          duration: 4000,
        });
        return;
      }

      if (maxCanAdd !== Infinity && newQuantity === maxCanAdd) {
        showWarningToast({
          title: "Maximo alcanzado",
          description: `Has alcanzado el limite para este producto`,
          duration: 3000,
        });
      }

      setQuantities((prev) => new Map(prev).set(productId, newQuantity));
    },
    [
      products,
      selectedProductsMap,
      getAvailableStock,
      selectedItemsMap,
      handleRemoveFromSelection,
      config.mode,
      config.validateStock,
    ]
  );

  const handleClearSelection = useCallback(() => {
    const count = getSelectedCount();
    if (count === 0) return;

    clearAllSelections();
    setQuantities(new Map());
    setSelectedProductsMap(new Map());

    showWarningToast({
      title: "Selección limpiada",
      description: `${count} producto${count !== 1 ? "s" : ""} removido${count !== 1 ? "s" : ""}`,
      duration: 2000,
    });
  }, [getSelectedCount, clearAllSelections]);

  const handleConfirmMultiSelect = async () => {
    const selectedProducts = getAllSelectedProducts();

    if (selectedProducts.length === 0) {
      showErrorToast({
        title: "Sin productos",
        description: "No has seleccionado ningún producto",
        duration: 3000,
      });
      return;
    }

    const invalidProducts: string[] = [];
    const productsWithQuantities = selectedProducts.map((product) => {
      const quantity = quantities.get(product.id) || 1;
      const validation = canAddProduct(product);

      if (
        !validation.canAdd ||
        (validation.availableToAdd !== undefined &&
          quantity > validation.availableToAdd)
      ) {
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
        title: "Productos con cantidad inválida",
        description: invalidProducts.join(", "),
        duration: 5000,
      });
      return;
    }

    showSuccessToast({
      title: "Productos confirmados",
      description: `${selectedProducts.length} producto${selectedProducts.length !== 1 ? "s" : ""} agregado${selectedProducts.length !== 1 ? "s" : ""}`,
      duration: 2000,
    });

    await platformWindows.emitToWindow(
      config.windowId,
      "product-multi-selected",
      productsWithQuantities
    ).catch(() => {});

    await platformWindows.closeCurrentWindow();
  };

  const getStockColor = (stock: number, stock_min: number) => {
    const stockMin: number = stock_min || 10;
    if (stock <= stockMin) return "danger";
    if (stock <= stockMin + 10) return "warning";
    return "success";
  };

  // ─── Columnas tabla de productos ───────────────────────────────────────────
  const columns = useMemo<ColumnDef<ProductGet>[]>(
    () => [
      {
        accessorKey: "codigo_interno",
        header: "Cód.",
        enableSorting: true,
        enableHiding: true,
        size: 60,
        minSize: 40,
        cell: ({ getValue }) => (
          <div className="text-center font-medium">{getValue<number>()}</div>
        ),
      },
      {
        accessorKey: "descripcion",
        header: "Producto",
        size: 300,
        minSize: 30,
        enableHiding: false,
        cell: ({ getValue }) => (
          <div className="flex flex-col">
            <h3 className="font-medium leading-tight truncate">
              {getValue<string>()}
            </h3>
          </div>
        ),
      },
      {
        accessorKey: "codigo_oem",
        header: "Cód. OEM",
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
        accessorKey: "codigo_upc",
        header: "Cód. UPC",
        size: 115,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="flex items-center justify-center">
            <span>{formatCell(getValue<string>())}</span>
          </div>
        ),
      },
      {
        accessorKey: "precio_venta",
        header: "Precio",
        size: 120,
        minSize: 100,
        cell: ({ row, getValue }) => {
          const precioAlt = row.original.precio_venta_alt;
          return (
            <div className="space-y-1 flex items-end flex-col">
              <div className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(getValue<number>())}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">
                  Alt: {formatCurrency(precioAlt)}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "stock_actual",
        header: "Stock",
        size: 110,
        minSize: 100,
        cell: ({ row }) => {
          const stock =
            typeof row.original.stock_actual === "string"
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
        accessorKey: "marca",
        header: "Marca",
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "categoria",
        header: "División",
        size: 150,
        minSize: 120,
        cell: ({ getValue }) => (
          <div className="space-y-1">
            <span className="font-medium">{getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: "procedencia",
        header: "Procedencia",
        size: 150,
        minSize: 120,
        cell: ({ getValue }) => (
          <div className="space-y-1">
            <span className="font-medium">{getValue<string>()}</span>
          </div>
        ),
      },
      {
        id: "acciones",
        header: "Acción",
        size: 170,
        minSize: 150,
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          const selected = isProductSelected(product.id);
          const selectedItem = selectedItemsMap.get(product.id);
          const validation = canAddProduct(product);

          let buttonText = "Seleccionar";
          let buttonVariant: "default" | "outline" | "secondary" = "outline";
          let icon = <Plus className="h-4 w-4" />;
          let tooltipText = "";

          if (!validation.canAdd) {
            buttonText = "No disponible";
            buttonVariant = "secondary";
            icon = <X className="h-4 w-4 hidden" />;
            tooltipText = validation.reason || "No disponible";
          } else if (selectedItem) {
            buttonText = `En carrito (${selectedItem.quantity})`;
            buttonVariant = "default";
            icon = <Check className="h-4 w-4" />;
            if (validation.availableToAdd !== undefined) {
              tooltipText = `Puedes agregar ${validation.availableToAdd} más`;
            }
          } else if (selected) {
            buttonText = "Seleccionado";
            buttonVariant = "default";
            icon = <Check className="h-4 w-4" />;
          }

          return (
            <div className="flex flex-col items-center gap-0.5">
              <TooltipButton
                onClick={() => handleProductSelect(product)}
                buttonProps={{
                  disabled: !validation.canAdd,
                  variant: buttonVariant,
                  className: "gap-2 w-full",
                }}
                tooltip={tooltipText || undefined}
              >
                {icon}
                <span className="truncate">{buttonText}</span>
              </TooltipButton>

              {validation.showStockInfo &&
                selectedItem &&
                validation.availableToAdd !== undefined && (
                  <span
                    className={`text-[10px] ${
                      validation.availableToAdd === 0
                        ? "text-red-600 dark:text-red-400 font-semibold"
                        : validation.availableToAdd <= 3
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {validation.availableToAdd === 0
                      ? "Máximo alcanzado"
                      : `+${validation.availableToAdd} disponible${validation.availableToAdd !== 1 ? "s" : ""}`}
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

  // ─── Columnas tabla de seleccionados ───────────────────────────────────────
  const selectedColumns = useMemo<ColumnDef<ProductGet>[]>(
    () => [
      {
        id: "nro",
        header: "N°",
        size: 36,
        minSize: 30,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-center block text-xs text-muted-foreground">
            {row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "descripcion",
        header: "Descripción",
        size: 260,
        minSize: 120,
        enableHiding: false,
        cell: ({ row, getValue }) => {
          const selectedItem = selectedItemsMap.get(row.original.id);
          return (
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate">
                {getValue<string>()}
              </span>
              {selectedItem && (
                <Badge
                  variant="secondary"
                  className="text-[10px] py-0 w-fit mt-0.5"
                >
                  {selectedItem.quantity} en carrito
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "codigo_upc",
        header: "Cód. UPC",
        size: 110,
        minSize: 80,
        cell: ({ getValue }) => (
          <div className="text-xs text-center">
            {formatCell(getValue<string>())}
          </div>
        ),
      },
      {
        accessorKey: "marca",
        header: "Marca",
        size: 90,
        minSize: 70,
        cell: ({ getValue }) => (
          <div className="text-xs">{formatCell(getValue<string>())}</div>
        ),
      },
      {
        accessorKey: "precio_venta",
        header: "Precio",
        size: 100,
        minSize: 80,
        cell: ({ getValue }) => (
          <div className="font-bold text-green-600 dark:text-green-400 text-right text-sm">
            {formatCurrency(getValue<number>())}
          </div>
        ),
      },
      {
        id: "cantidad",
        header: "Cantidad",
        size: 140,
        minSize: 130,
        cell: ({ row }) => {
          const product = row.original;
          const quantity = quantities.get(product.id) || 1;
          // const validation = canAddProduct(product);
          // const maxCanAdd = validation.availableToAdd ?? Infinity;
          // const isAtLimit =
          //   config.validateStock &&
          //   maxCanAdd !== Infinity &&
          //   quantity >= maxCanAdd;

          return (
            <EditableQuantity
              value={quantity}
              className="w-full"
              buttonClassName="w-full"
              onSubmit={(value) =>
                handleQuantityChange(product.id, value as number)
              }
              validate={(val) => {
                const num = parseInt(String(val));
                return !isNaN(num) && num > 0;
              }}
              disabled={false}
              disableWheel
              disableArrowKeys
              columnKey="cantidad-selected"
            />
          );
        },
      },
      {
        id: "subtotal",
        header: "Subtotal",
        size: 105,
        minSize: 85,
        cell: ({ row }) => {
          const quantity = quantities.get(row.original.id) || 1;
          const subtotal = row.original.precio_venta * quantity;
          return (
            <div className="font-semibold text-right text-sm text-green-600 dark:text-green-400">
              {formatCurrency(subtotal)}
            </div>
          );
        },
      },
      {
        id: "estado",
        header: "Stock",
        size: 75,
        minSize: 60,
        cell: ({ row }) => {
          const product = row.original;
          const validation = canAddProduct(product);
          const quantity = quantities.get(product.id) || 1;
          const maxCanAdd = validation.availableToAdd ?? Infinity;
          const isAtLimit =
            config.validateStock &&
            maxCanAdd !== Infinity &&
            quantity >= maxCanAdd;

          if (!config.validateStock)
            return (
              <span className="text-[10px] text-muted-foreground text-center block">
                —
              </span>
            );

          return (
            <div className="text-center">
              {isAtLimit ? (
                <Badge variant="danger" className="text-[10px]">
                  Máx
                </Badge>
              ) : validation.availableToAdd !== undefined ? (
                <span className="text-[10px] text-muted-foreground">
                  +{validation.availableToAdd} disp.
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">—</span>
              )}
            </div>
          );
        },
      },
      {
        id: "quitar",
        header: "",
        size: 44,
        minSize: 44,
        enableSorting: false,
        cell: ({ row }) => (
          <TooltipButton
            onClick={() => handleRemoveFromSelection(row.original)}
            buttonProps={{
              variant: "ghost",
              className:
                "size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/40",
            }}
            tooltip="Quitar producto"
          >
            <Trash2 className="h-4 w-4" />
          </TooltipButton>
        ),
      },
    ],
    [
      quantities,
      canAddProduct,
      config.validateStock,
      selectedItemsMap,
      handleQuantityChange,
      handleRemoveFromSelection,
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
    columnResizeMode: "onChange",
    persistenceKey: `product-selector-${config.context}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const selectedProducts = getAllSelectedProducts();

  const { table: selectedTable } = useCustomTable({
    data: selectedProducts,
    columns: selectedColumns,
    enableSorting: false,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    enableRowSelection: false,
    enableColumnVisibility: false,
    enableColumnOrdering: false,
    enablePagination: false,
  });

  const { selectedIndex, setSelectedIndex, isFocused } = useKeyboardNavigation<
    ProductGet,
    HTMLTableElement
  >({
    items: products,
    containerRef: tableRef,
    onPrimaryAction: (product) => {
      handleProductSelect(product);
    },
    onSecondaryAction: () => {},
    onDeleteAction: () => {},
    getItemId: (product) => product.id,
  });

  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleRowDoubleClick = (product: ProductGet) => {
    handleProductSelect(product);
  };

  const handleClose = async () => {
    await platformWindows.emitToWindow(config.windowId, "window-closed", { canceled: true }).catch(() => {});
    await platformWindows.closeCurrentWindow();
  };

  const onPageChange = (page: number) => setPage(page);
  const onShowRowsChange = (rows: number) => setPageSize(rows);
  const handleRefetchProducts = () => refetchProducts();
  const toggleShowFilters = () => setShowFilters(!showFilters);

  const handleManualSearch = () => {
    if (searchMode === "manual") applyFilters();
    saveFilters();
  };

  const handleResetFilters = () => {
    resetFilters();
    localStorage.removeItem(STORAGE_KEY);
  };

  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const totalSelectedUnits = selectedProducts.reduce(
    (sum, p) => sum + (quantities.get(p.id) || 1),
    0
  );

  const totalSelectedAmount = selectedProducts.reduce(
    (sum, p) => sum + p.precio_venta * (quantities.get(p.id) || 1),
    0
  );

  const contextTitle = useMemo(() => {
    const titles: Record<string, string> = {
      purchase: "Agregar a Compra",
      sale: "Agregar a Venta",
      quote: "Agregar a Cotización",
      transfer: "Agregar a Transferencia",
      inventory: "Seleccionar Productos",
    };
    return titles[config.context] || "Seleccionar Productos";
  }, [config.context]);

  useCommands(
    {
      "searchFilters.focusSearch": handleManualSearch,
      "forms.reset": handleResetFilters,
    },
    { enableOnFormTags: true }
  );

  return (
    <main className="h-full p-2 flex flex-col bg-secondary gap-2">
      {/* Header */}
      <header className="bg-background rounded-lg p-2 border border-border flex-shrink-0 flex flex-col divide-y divide-border gap-1">
        <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap pb-2">
          <div className="flex items-center gap-2 md:gap-4 grow">
            <Package className="h-5 w-5 text-primary" />
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-primary">{contextTitle}</h1>
              {!config.simpleMode && (
                <Badge
                  variant={config.mode === "edit" ? "default" : "secondary"}
                >
                  {config.mode === "edit" ? "Editando" : "Nuevo"}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isMultiSelect && getSelectedCount() > 0 && (
              <Badge variant="accent">{totalSelectedUnits} seleccionados</Badge>
            )}

            <Button
              variant="ghost"
              onClick={toggleSearchMode}
              className="text-xs h-7"
              title={
                searchMode === "realtime"
                  ? "Cambiar a búsqueda manual"
                  : "Cambiar a búsqueda en tiempo real"
              }
            >
              <Zap
                className={`h-3 w-3 ${
                  searchMode === "realtime"
                    ? "text-yellow-500"
                    : "text-gray-500"
                }`}
              />
              {searchMode === "realtime" ? "Tiempo real" : "Manual"}
            </Button>

            <TooltipButton
              onClick={handleRefetchProducts}
              buttonProps={{ className: "w-8", disabled: isFetching }}
              tooltip="Recargar productos"
            >
              <RefreshCcw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </TooltipButton>

            <Button variant={"outline"} onClick={toggleShowFilters}>
              {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </Button>

            <Button onClick={handleResetFilters}>
              <PackageSearch className="h-4 w-4" />
              Nueva búsqueda
            </Button>

            {isMultiSelect && getSelectedCount() > 0 && (
              <Button onClick={handleConfirmMultiSelect} className="gap-2">
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

      {/* Body — ResizablePanelGroup */}
      <ResizablePanelGroup
        direction="vertical"
        className="flex-1 min-h-0 gap-1"
      >
        {/* Panel superior — Tabla de productos */}
        <ResizablePanel
          id="product-selector-products"
          order={1}
          defaultSize={isMultiSelect ? 65 : 100}
          minSize={30}
          className="bg-background rounded-lg border border-border flex flex-col"
        >
          <div className="h-full flex flex-col">
            {/* Info + controles */}
            <div className="p-2 text-sm text-foreground border-b border-border flex-shrink-0 flex items-center justify-between">
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
                  <div className="border border-border rounded-sm gap-2 flex items-center px-2 h-8">
                    <Switch
                      id="multi-select"
                      checked={isMultiSelect}
                      onCheckedChange={setIsMultiSelect}
                    />
                    <Label htmlFor="multi-select">Selección múltiple</Label>
                  </div>
                )}
                <ColumnVisibilityDropdown table={table} />
              </div>
            </div>

            {/* Tabla */}
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
        </ResizablePanel>

        {/* Panel inferior — Tabla de seleccionados (solo en multiSelect) */}
        {isMultiSelect && (
          <>
            <ResizableHandle withHandle />

            <ResizablePanel
              id="product-selector-selected"
              order={2}
              defaultSize={35}
              minSize={20}
              className="bg-background rounded-lg border border-border flex flex-col"
            >
              {/* Header del panel */}
              <div className="bg-primary/10 px-3 py-2 border-b border-border flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-primary">
                    Productos seleccionados
                  </h3>
                  {getSelectedCount() > 0 && (
                    <Badge variant="accent" className="text-xs">
                      {getSelectedCount()} producto
                      {getSelectedCount() !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Totales */}
                  {getSelectedCount() > 0 && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground border-r border-border pr-2 mr-1">
                      <span>
                        Unidades:{" "}
                        <span className="font-semibold text-foreground">
                          {totalSelectedUnits}
                        </span>
                      </span>
                      <span>
                        Total:{" "}
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(totalSelectedAmount)}
                        </span>
                      </span>
                    </div>
                  )}

                  {getSelectedCount() > 1 && (
                    <TooltipButton
                      onClick={handleClearSelection}
                      buttonProps={{
                        variant: "ghost",
                        className:
                          "size-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/50",
                      }}
                      tooltip="Limpiar selección"
                    >
                      <Trash2 className="h-4 w-4" />
                    </TooltipButton>
                  )}

                  {getSelectedCount() > 0 && (
                    <Button
                      onClick={handleConfirmMultiSelect}
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Confirmar
                    </Button>
                  )}
                </div>
              </div>

              {/* Tabla de seleccionados o estado vacío */}
              <div className="flex-1 min-h-0">
                {selectedProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <ShoppingCart className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Ningún producto seleccionado aún</p>
                    <p className="text-xs">
                      Haz clic en "Seleccionar" o doble clic en una fila
                    </p>
                  </div>
                ) : (
                  <CustomizableTable
                    table={selectedTable}
                    isError={false}
                    isFetching={false}
                    isLoading={false}
                    errorMessage=""
                    rows={selectedProducts.length}
                    noDataMessage="Sin productos seleccionados"
                    keyboardNavigationEnabled={false}
                    enableColumnReordering={false}
                    enableSorting={false}
                  />
                )}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </main>
  );
};

export default ProductSelectorWindow;
