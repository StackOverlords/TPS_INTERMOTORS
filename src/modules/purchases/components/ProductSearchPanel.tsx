import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import CustomizableTable from '@/components/common/CustomizableTable';
import { apiConstructor } from '@/modules/products/services/api';
import { formatCurrency } from '@/utils/formaters';
import { useQuery } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Loader2, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDebounce } from 'use-debounce';

interface ProductResponse {
  id: number;
  descripcion: string;
  codigo_oem: string;
  codigo_upc: string;
  modelo: string;
  medida: string | null;
  nro_motor: string;
  categoria: string;
  subcategoria: string;
  marca: string;
  procedencia: string;
  unidad_medida: string;
  stock_actual: string;
  stock_resto: string;
  pedido_transito: string;
  pedido_almacen: string;
  precio_venta: string;
  precio_venta_alt: string;
  sucursal: string;
}

interface ProductSearchPanelProps {
  selectedProducts: any[];
  onProductSelect: (product: ProductResponse) => void;
}

const ProductSearchPanel: React.FC<ProductSearchPanelProps> = ({
  selectedProducts,
  onProductSelect,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [allProducts, setAllProducts] = useState<ProductResponse[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    data: productsResponse,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['products', page, pageSize, debouncedSearchTerm],
    queryFn: () => {
      const searchParam = debouncedSearchTerm
        ? `&descripcion=${encodeURIComponent(debouncedSearchTerm)}`
        : '';
      return apiConstructor({
        url: `/products?pagina=${page}&pagina_registros=${pageSize}&sucursal=1${searchParam}`,
        method: 'GET',
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Reset cuando cambia el término de búsqueda
  useEffect(() => {
    setPage(1);
    setAllProducts([]);
    setHasNextPage(true);
  }, [debouncedSearchTerm]);

  // Manejar los productos cuando llega nueva data
  useEffect(() => {
    if (productsResponse) {
      if (page === 1) {
        setAllProducts(productsResponse);
      } else {
        setAllProducts(prev => [...prev, ...productsResponse]);
      }

      setHasNextPage(productsResponse.length === pageSize);
    }
  }, [productsResponse, page, pageSize]);

  // Función para manejar el scroll infinito
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isFetching || !hasNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    if (scrollHeight - scrollTop - clientHeight < 100) {
      setPage(prev => prev + 1);
    }
  }, [isFetching, hasNextPage]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Verificar si un producto ya está seleccionado
  const isProductSelected = useCallback(
    (productId: number) => {
      return selectedProducts.some(
        p => p.id_producto === productId.toString() || p.producto?.id === productId
      );
    },
    [selectedProducts]
  );

  const columns = useMemo<ColumnDef<ProductResponse>[]>(
    () => [
      {
        accessorKey: 'descripcion',
        header: 'Producto',
        size: 200,
        cell: ({ getValue }) => (
          <div className="font-medium text-xs text-gray-900 truncate max-w-[200px]">
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
    data: allProducts,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Buscar Productos
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por descripción..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm border-gray-200"
          />
        </div>
      </div>

      {/* Table Container */}
      <div
        ref={scrollContainerRef}
        id="product-scroll-container"
        className="flex-1 overflow-auto"
      >
        {isLoading && page === 1 ? (
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
        ) : allProducts.length > 0 ? (
          <InfiniteScroll
            dataLength={allProducts.length}
            next={() => setPage(prev => prev + 1)}
            hasMore={hasNextPage}
            loader={
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500 text-xs">
                  Cargando más...
                </span>
              </div>
            }
            scrollableTarget="product-scroll-container"
            endMessage={
              allProducts.length > 10 && (
                <div className="text-center py-4 text-gray-500 text-xs">
                  No hay más productos
                </div>
              )
            }
          >
            <CustomizableTable
              table={table}
              errorMessage="Ocurrió un error al cargar los productos."
              isLoading={false}
            />
          </InfiniteScroll>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No se encontraron productos
          </div>
        )}
      </div>

      {/* Footer con contador */}
      {allProducts.length > 0 && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            {allProducts.length} productos encontrados
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductSearchPanel;
