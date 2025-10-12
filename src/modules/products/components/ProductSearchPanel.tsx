import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import CustomizableTable from '@/components/common/CustomizableTable';
import Pagination from '@/components/common/pagination';
import { ComboboxSelect } from '@/components/common/SelectCombobox';
import type { ProductGet } from '@/modules/products/types/ProductGet';
import { useCategoriesWithSubcategories } from '@/modules/shared/hooks/useCategories';
import { useCommonBrands } from '@/modules/shared/hooks/useCommonBrands';
import { formatCurrency } from '@/utils/formaters';
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Loader2, Plus, RotateCcw, Search, Zap } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useProductFilters } from '@/modules/products/hooks/useProductFilters';
import { useBranchStore } from '@/states/branchStore';
import { useProductsPaginated } from '../hooks/queries/useProductsPaginated';

interface ProductSearchPanelProps {
  selectedProducts: any[];
  onProductSelect: (product: ProductGet) => void;
  defaultSearchMode?: 'realtime' | 'manual';
}

const ProductSearchPanel: React.FC<ProductSearchPanelProps> = ({
  selectedProducts,
  onProductSelect,
  defaultSearchMode = 'manual',
}) => {
  // Estado para el modo de búsqueda
  const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>(defaultSearchMode);

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
    setPageSize
  } = useProductFilters(Number(selectedBranchId));

  // Obtener datos de filtros
  const { data: categoriesData } = useCategoriesWithSubcategories();
  const { data: brandsData } = useCommonBrands();

  // Determinar qué filtros usar según el modo
  const activeFilters = searchMode === 'realtime' ? debouncedFilters : appliedFilters;

  const {
    data: productsResponse,
    isLoading,
    error,
  } = useProductsPaginated(activeFilters);

  // Obtener productos y meta información
  const products = productsResponse?.data || [];
  const totalProducts = productsResponse?.meta?.total || 0;

  // Verificar si un producto ya está seleccionado
  const isProductSelected = useCallback(
    (productId: number) => {
      return selectedProducts.some(
        p => p.id_producto === productId.toString() || p.producto?.id === productId
      );
    },
    [selectedProducts]
  );

  // Manejar búsqueda manual
  const handleManualSearch = () => {
    if (searchMode === 'manual') {
      applyFilters();
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    resetFilters();
  };

  // Toggle del modo de búsqueda
  const toggleSearchMode = () => {
    setSearchMode(prev => prev === 'realtime' ? 'manual' : 'realtime');
  };

  const columns = useMemo<ColumnDef<ProductGet>[]>(
    () => [
      {
        accessorKey: 'descripcion',
        header: 'Producto',
        size: 150,
        cell: ({ getValue }) => (
          <div className="font-bold text-xs text-gray-900 truncate">
            {getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'codigo_oem',
        header: 'OEM',
        size: 100,
        cell: ({ getValue }) => (
          <div className="text-xs text-gray-600 font-mono">
            {getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'marca',
        header: 'Marca',
        size: 100,
        cell: ({ getValue }) => (
          <Badge variant="secondary" className="text-xs">
            {getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'categoria',
        header: 'Categoría',
        size: 110,
        cell: ({ getValue }) => (
          <Badge variant="outline" className="text-xs">
            {getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'precio_venta',
        header: 'Precio',
        size: 80,
        cell: ({ getValue }) => (
          <div className="text-xs font-semibold text-green-600 text-right">
            {formatCurrency(Number(getValue()))}
          </div>
        ),
      },
      {
        accessorKey: 'stock_actual',
        header: 'Stock',
        size: 70,
        cell: ({ row, getValue }) => {
          const stock = parseInt(getValue() as string, 10);
          return (
            <div className="text-xs text-center">
              <span
                className={
                  stock > 0 ? 'text-gray-900 font-medium' : 'text-red-600'
                }
              >
                {stock}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                {row.original.unidad_medida}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 90,
        cell: ({ row }) => {
          const isSelected = isProductSelected(row.original.id);
          return (
            <Button
              type='button'
              size="sm"
              variant={isSelected ? 'outline' : 'default'}
              disabled={isSelected}
              onClick={() => onProductSelect(row.original)}
              className={
                isSelected
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed h-7 text-xs'
                  : 'bg-gray-900 hover:bg-gray-800 h-7 text-xs'
              }
            >
              {isSelected ? (
                '✓ Agregado'
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
    setPageSize(rows)
  };

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header con Filtros */}
      <div className="p-3 border-b border-gray-200 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">
              Buscar Productos
            </h3>
          </div>
          <div className="flex gap-1">
            {/* Toggle de modo de búsqueda */}
            <Button
              type='button'
              size="sm"
              variant="ghost"
              onClick={toggleSearchMode}
              className="text-xs h-7"
              title={searchMode === 'realtime' ? 'Cambiar a búsqueda manual' : 'Cambiar a búsqueda en tiempo real'}
            >
              <Zap className={`h-3 w-3 ${searchMode === 'realtime' ? 'text-yellow-500' : 'text-gray-500'}`} />
              {searchMode === 'realtime' ? 'Tiempo real' : 'Manual'}
            </Button>
            <Button
              type='button'
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Limpiar
            </Button>
            {/* Botón de búsqueda solo visible en modo manual */}
            {searchMode === 'manual' && (
              <Button
                type='button'
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
                value={filters.descripcion || ''}
                onChange={e => updateFilter('descripcion', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchMode === 'manual' && handleManualSearch()}
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
                value={filters.codigo_oem || ''}
                onChange={e => updateFilter('codigo_oem', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchMode === 'manual' && handleManualSearch()}
                className="pl-8 h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-1">
            <Label>Categoría</Label>
            <ComboboxSelect
              value={filters.categoria}
              onChange={(value: string | number) => {
                const parsed = value === 'all' ? undefined : Number(value);
                updateFilter('categoria', parsed);
              }}
              options={(categoriesData || []).map(cat => ({
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
              value={filters.marca || 'all'}
              onChange={(value: string | number) => {
                const strValue = String(value);
                updateFilter('marca', strValue === 'all' ? undefined : strValue);
              }}
              options={(brandsData || []).map(brand => ({
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
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Cargando productos...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 text-sm">
            <p>Error al cargar los productos</p>
            <p className="text-xs mt-1">Intenta nuevamente</p>
          </div>
        ) : products.length > 0 ? (
          <CustomizableTable
            table={table}
            isLoading={false}
          />
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            {searchMode === 'manual' ?
              'Haz clic en "Buscar" para ver los productos' :
              'No se encontraron productos'
            }
          </div>
        )}
      </div>

      {/* Footer con Paginación */}
      {products.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
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
};

export default ProductSearchPanel;