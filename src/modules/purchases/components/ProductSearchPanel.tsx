import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { productsService } from "@/modules/products/services/productService";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import { useCategoriesWithSubcategories } from "@/modules/shared/hooks/useCategories";
import { useCommonBrands } from "@/modules/shared/hooks/useCommonBrands";
import { formatCurrency } from "@/utils/formaters";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Loader2, Plus, RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ProductSearchPanelProps {
  selectedProducts: any[];
  onProductSelect: (product: ProductGet) => void;
}

const ProductSearchPanel: React.FC<ProductSearchPanelProps> = ({
  selectedProducts,
  onProductSelect,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtros locales
  const [localFilters, setLocalFilters] = useState({
    descripcion: "",
    codigo_oem: "",
    categoria: undefined as number | undefined,
    marca: "" as string | undefined,
  });

  // Filtros aplicados (los que se envían al API)
  const [appliedFilters, setAppliedFilters] = useState(localFilters);

  const [sorting, setSorting] = useState<SortingState>([]);

  // Obtener datos de filtros
  const { data: categoriesData } = useCategoriesWithSubcategories();
  const { data: brandsData } = useCommonBrands();

  const {
    data: productsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", page, pageSize, appliedFilters],
    queryFn: () => {
      const filters = {
        pagina: page,
        pagina_registros: pageSize,
        sucursal: 1,
        ...(appliedFilters.descripcion && {
          descripcion: appliedFilters.descripcion,
        }),
        ...(appliedFilters.codigo_oem && {
          codigo_oem: appliedFilters.codigo_oem,
        }),
        ...(appliedFilters.categoria && {
          categoria: appliedFilters.categoria,
        }),
        ...(appliedFilters.marca && { marca: appliedFilters.marca }),
      };

      return productsService.getAll(filters);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Reset cuando cambian los filtros aplicados
  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  // Obtener productos y meta información
  const products = productsResponse?.data || [];
  const totalProducts = productsResponse?.meta?.total || 0;

  // Verificar si un producto ya está seleccionado
  const isProductSelected = useCallback(
    (productId: number) => {
      return selectedProducts.some(
        (p) =>
          p.id_producto === productId.toString() || p.producto?.id === productId
      );
    },
    [selectedProducts]
  );

  // Manejar búsqueda
  const handleSearch = () => {
    setAppliedFilters(localFilters);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    const emptyFilters = {
      descripcion: "",
      codigo_oem: "",
      categoria: undefined,
      marca: undefined,
    };
    setLocalFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  // Actualizar filtro local
  const updateLocalFilter = <K extends keyof typeof localFilters>(
    key: K,
    value: (typeof localFilters)[K]
  ) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const columns = useMemo<ColumnDef<ProductGet>[]>(
    () => [
      {
        accessorKey: "descripcion",
        header: "Producto",
        size: 150,
        cell: ({ getValue }) => (
          <div className="font-bold text-xs text-foreground truncate ">
            {getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "codigo_oem",
        header: "OEM",
        size: 100,
        cell: ({ getValue }) => (
          <div className="text-xs text-muted-foreground font-mono">
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
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-right">
            {formatCurrency(Number(getValue()))}
          </div>
        ),
      },
      {
        accessorKey: "stock_actual",
        header: "Stock",
        size: 70,
        cell: ({ row, getValue }) => {
          const stock = parseInt(getValue() as string, 10);
          return (
            <div className="text-xs text-center">
              <span
                className={
                  stock > 0 ? "text-foreground font-medium" : "text-destructive"
                }
              >
                {stock}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                {row.original.unidad_medida}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 90,
        cell: ({ row }) => {
          const isSelected = isProductSelected(row.original.id);
          return (
            <Button
              size="sm"
              variant={isSelected ? "outline" : "default"}
              disabled={isSelected}
              onClick={() => onProductSelect(row.original)}
              className={
                isSelected
                  ? "h-7 text-xs"
                  : "h-7 text-xs"
              }
            >
              {isSelected ? (
                "✓ Agregado"
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar
                </>
              )}
            </Button>
          );
        },
      },
    ],
    [isProductSelected, onProductSelect]
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
    setPage(1);
  };

  return (
    <div className="h-full flex flex-col border border-border rounded-lg">
      {/* Header con Filtros */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Buscar Productos
          </h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
            <Button
              size="sm"
              onClick={handleSearch}
              className="h-7 text-xs"
            >
              <Search className="h-3 w-3 mr-1" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Filtros en Grid */}
        <div className="grid grid-cols-4 gap-2">
          {/* Descripción */}
          <div className="space-y-1">
            <Label className="text-xs">Descripción</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 h-3 w-3" />
              <Input
                placeholder="Buscar..."
                value={localFilters.descripcion}
                onChange={(e) =>
                  updateLocalFilter("descripcion", e.target.value)
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* OEM */}
          <div className="space-y-1">
            <Label className="text-xs">Código OEM</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 h-3 w-3" />
              <Input
                placeholder="OEM..."
                value={localFilters.codigo_oem}
                onChange={(e) =>
                  updateLocalFilter("codigo_oem", e.target.value)
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-8 h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* División */}
          <div className="space-y-1">
            <Label className="text-xs">División</Label>
            <ComboboxSelect
              value={localFilters.categoria}
              onChange={(value: string | number) => {
                const parsed = value === "all" ? undefined : Number(value);
                updateLocalFilter("categoria", parsed);
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
            <Label className="text-xs">Marca</Label>
            <ComboboxSelect
              value={localFilters.marca || "all"}
              onChange={(value: string | number) => {
                const strValue = String(value);
                updateLocalFilter(
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
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
            <span className="ml-2 text-sm text-muted-foreground">
              Cargando productos...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">
            <p>Error al cargar los productos</p>
            <p className="text-xs mt-1">Intenta nuevamente</p>
          </div>
        ) : products.length > 0 ? (
          <CustomizableTable table={table} isLoading={false} />
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No se encontraron productos
          </div>
        )}
      </div>

      {/* Footer con Paginación */}
      {products.length > 0 && (
        <div className="border-t border-border bg-accent/30 dark:bg-accent/50">
          <Pagination
            currentPage={page}
            onPageChange={handlePageChange}
            totalData={totalProducts}
            onShowRowsChange={handleShowRowsChange}
            showRows={pageSize}
          />
        </div>
      )}
    </div>
  );
};

export default ProductSearchPanel;
