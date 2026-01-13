import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import { useCategoriesWithSubcategories } from "@/modules/shared/hooks/useCategories";
import { useCommonBrands } from "@/modules/shared/hooks/useCommonBrands";
import { formatCurrency } from "@/utils/formaters";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Check, Plus, RotateCcw, Search, Zap } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useProductFilters } from "@/modules/products/hooks/useProductFilters";
import { useBranchStore } from "@/states/branchStore";
import { useProductsPaginated } from "../hooks/queries/useProductsPaginated";
import type { CartItem } from "@/modules/shoppingCart/types/cart.types";

type BaseWithId = { id_producto: number };

interface ProductSearchPanelProps<T extends BaseWithId | CartItem> {
  selectedProducts: T[];
  onProductSelect: (product: ProductGet) => void;
  defaultSearchMode?: "realtime" | "manual";
  onlySelectWithStock?: boolean;
  allowExceedStock?: boolean;
}

function ProductSearchPanel<T extends BaseWithId | CartItem>({
  selectedProducts,
  onProductSelect,
  defaultSearchMode = "manual",
  onlySelectWithStock = false,
  allowExceedStock = false,
}: ProductSearchPanelProps<T>) {
  // Estado para el modo de búsqueda
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">(
    defaultSearchMode
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const { selectedBranchId } = useBranchStore();

  // Hook de filtros con el nuevo applyFilters
  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    setPage,
    resetFilters,
    applyFilters,
    setPageSize,
  } = useProductFilters(Number(selectedBranchId));

  // Obtener datos de filtros
  const { data: categoriesData } = useCategoriesWithSubcategories();
  const { data: brandsData } = useCommonBrands();

  // Determinar qué filtros usar según el modo
  const activeFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  const {
    data: productsResponse,
    isLoading,
    isError,
    isFetching,
  } = useProductsPaginated(activeFilters);

  // Obtener productos y meta información
  const products = productsResponse?.data || [];
  const totalProducts = productsResponse?.meta?.total || 0;

  // Verificar si un producto ya está seleccionado
  const isProductSelected = useCallback(
    (productId: number) => {
      const item = selectedProducts.find((p) =>
        "id_producto" in p
          ? p.id_producto === productId
          : p.product.id === productId
      );

      return {
        isSelected: !!item,
        item,
      };
    },
    [selectedProducts]
  );

  // Manejar búsqueda manual
  const handleManualSearch = () => {
    if (searchMode === "manual") {
      applyFilters();
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    resetFilters();
  };

  // Toggle del modo de búsqueda
  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));
  };

  const getStockColor = (stock: number, stock_min: number) => {
    const stockMin: number = stock_min || 10;
    if (stock <= stockMin) return "danger";
    if (stock <= stockMin + 10) return "warning";
    return "success";
  };

  const columns = useMemo<ColumnDef<ProductGet>[]>(
    () => [
      {
        accessorKey: "descripcion",
        header: "Producto",
        size: 150,
        cell: ({ getValue }) => (
          <div className="font-bold text-xs text-primary truncate">
            {getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "codigo_oem",
        header: "OEM",
        size: 100,
        cell: ({ getValue }) => (
          <div className="text-xs text-gray-600 font-mono">
            {getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "marca",
        header: "Marca",
        size: 100,
        cell: ({ getValue }) => (
          <Badge variant="secondary" className="text-xs">
            {getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: "categoria",
        header: "División",
        size: 110,
        cell: ({ getValue }) => (
          <Badge variant="outline" className="text-xs">
            {getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: "precio_venta",
        header: "Precio",
        size: 80,
        cell: ({ getValue }) => (
          <div className="text-xs font-semibold text-green-600 text-right">
            {formatCurrency(Number(getValue()))}
          </div>
        ),
      },
      {
        accessorKey: "stock_actual",
        header: "Stock Actual",
        size: 80,
        minSize: 60,
        cell: ({ row, getValue }) => {
          const stock =
            typeof getValue() === "string"
              ? parseFloat(getValue() as string)
              : getValue<number>();
          const stockDisplay = isFinite(stock) ? stock.toFixed(0) : "0";
          const stockMin = row.original.stock_minimo || 1;
          return (
            <Badge
              variant={getStockColor(stock, stockMin)}
              className={`flex flex-col justify-center rounded`}
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
        id: "actions",
        header: "Acciones",
        size: 90,
        cell: ({ row }) => {
          const product = row.original;

          const { isSelected, item } = isProductSelected(row.original.id);

          const quantity = item && "quantity" in item ? item.quantity : null;

          // Lógica de deshabilitado del botón
          let isDisabled = false;
          let buttonText = "";
          let buttonVariant: "default" | "outline" = "default";
          let showExtraIndicator = false;

          // Si onlySelectWithStock está activo
          if (onlySelectWithStock) {
            // No se puede agregar si no hay stock
            if (product.stock_actual <= 0) {
              isDisabled = true;
            }
            // No se puede agregar más si ya alcanzó el stock
            if (quantity != null && quantity >= product.stock_actual) {
              isDisabled = true;
            }
          } else {
            // Si allowExceedStock está desactivado
            if (!allowExceedStock) {
              // Comportamiento similar a onlySelectWithStock pero más permisivo
              if (quantity != null && quantity >= product.stock_actual) {
                isDisabled = true;
              }
            }
            // Si allowExceedStock está activado, nunca se deshabilita por stock
          }

          // Determinar el texto y variante del botón
          if (isSelected) {
            buttonVariant = "outline";
            if (quantity != null) {
              if (quantity > product.stock_actual && allowExceedStock) {
                // Mostrar cantidad que excede el stock
                const extraQuantity = quantity - product.stock_actual;
                buttonText = `${quantity} (${extraQuantity} extra)`;
                showExtraIndicator = true;
              } else if (
                quantity >= product.stock_actual &&
                !allowExceedStock
              ) {
                buttonText = "Agregado";
              } else {
                buttonText = `${quantity} Agregados`;
              }
            } else {
              buttonText = "Agregado";
            }
          } else {
            buttonText = "Agregar";
          }

          return (
            <Button
              type="button"
              size="sm"
              variant={buttonVariant}
              disabled={isDisabled}
              onClick={() => onProductSelect(product)}
              className={`h-7 text-xs cursor-pointer`}
            >
              {isDisabled &&
              quantity != null &&
              quantity >= product.stock_actual ? (
                <>
                  <Check className="size-3" />
                  Agregado
                </>
              ) : isSelected ? (
                <>
                  {showExtraIndicator ? (
                    <span className="text-muted-foreground">{buttonText}</span>
                  ) : (
                    buttonText
                  )}
                </>
              ) : (
                <>
                  <Plus className="size-3" />
                  {buttonText}
                </>
              )}
            </Button>
          );
        },
      },
    ],
    [isProductSelected, onProductSelect, onlySelectWithStock, allowExceedStock]
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
  });

  // Manejadores de paginación
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleShowRowsChange = (rows: number) => {
    setPageSize(rows);
  };

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      {/* Header con Filtros */}
      <header className="p-3 border-b border-border space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-primary">
              Buscar Productos
            </h3>
          </div>
          <div className="flex gap-1">
            {/* Toggle de modo de búsqueda */}
            <Button
              type="button"
              size="sm"
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
                className={`h-3 w-3 ${searchMode === "realtime" ? "text-yellow-500" : "text-gray-500"}`}
              />
              {searchMode === "realtime" ? "Tiempo real" : "Manual"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Limpiar
            </Button>
            {/* Botón de búsqueda solo visible en modo manual */}
            {searchMode === "manual" && (
              <Button
                type="button"
                size="sm"
                onClick={handleManualSearch}
                className="h-7 text-xs"
              >
                <Search className="h-3 w-3 mr-1" />
                Buscar
              </Button>
            )}
          </div>
        </div>

        {/* Filtros en Grid */}
        <div className="grid grid-cols-4 gap-2">
          {/* Descripción */}
          <div className="space-y-1">
            <Label>Descripción</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
              <Input
                placeholder="Buscar..."
                value={filters.descripcion || ""}
                onChange={(e) => updateFilter("descripcion", e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  searchMode === "manual" &&
                  handleManualSearch()
                }
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* OEM */}
          <div className="space-y-1">
            <Label>Código OEM</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
              <Input
                placeholder="OEM..."
                value={filters.codigo_oem || ""}
                onChange={(e) => updateFilter("codigo_oem", e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  searchMode === "manual" &&
                  handleManualSearch()
                }
                className="pl-8 h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* División */}
          <div className="space-y-1">
            <Label>División</Label>
            <ComboboxSelect
              value={filters.categoria}
              onChange={(value: string | number) => {
                const parsed = value === "all" ? undefined : Number(value);
                updateFilter("categoria", parsed);
              }}
              options={(categoriesData || []).map((cat) => ({
                id: String(cat.id),
                categoria: cat.categoria,
              }))}
              optionTag="categoria"
              enableAllOption={true}
              placeholder="Todas"
              className="h-8 text-xs"
            />
          </div>

          {/* Marca */}
          <div className="space-y-1">
            <Label>Marca</Label>
            <ComboboxSelect
              value={filters.marca || "all"}
              onChange={(value: string | number) => {
                const strValue = String(value);
                updateFilter(
                  "marca",
                  strValue === "all" ? undefined : strValue
                );
              }}
              options={(brandsData || []).map((brand) => ({
                id: brand.id,
                marca: brand.marca,
              }))}
              optionTag="marca"
              enableAllOption={true}
              placeholder="Todas"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </header>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <CustomizableTable
          table={table}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          rows={filters.pagina_registros}
          errorMessage="Ocurrió un error al cargar los productos"
          noDataMessage="No se encontraron productos"
        />
      </div>

      {/* Footer con Paginación */}
      {products.length > 0 && (
        <div className="flex-shrink-0 border-t border-border bg-card">
          <Pagination
            currentPage={filters.pagina}
            onPageChange={handlePageChange}
            totalData={totalProducts}
            onShowRowsChange={handleShowRowsChange}
            showRows={filters.pagina_registros}
          />
        </div>
      )}
    </div>
  );
}

export default ProductSearchPanel;
