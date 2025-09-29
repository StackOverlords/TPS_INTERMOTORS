import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Checkbox } from '@/components/atoms/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import ResizableBox from '@/components/atoms/resizable-box';
import { Switch } from '@/components/atoms/switch';
import CustomizableTable from '@/components/common/CustomizableTable';
import Pagination from '@/components/common/pagination';
import RowsPerPageSelect from '@/components/common/RowsPerPageSelect';
import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { formatCell } from '@/utils/formatCell';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import {
  Edit,
  Eye,
  FileText,
  Filter,
  Loader2,
  MoreVertical,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from 'react-router';
import { useDebounce } from 'use-debounce';
import DeletePurchaseDialog from '../components/DeletePurchaseDialog';
import PurchaseFilters from '../components/purchaseList/PurchaseFilters';
import { usePurchaseDelete } from '../hooks/usePurchaseDelete';
import { usePurchaseFilters } from '../hooks/usePurchaseFilters';
import { usePurchasesPaginated } from '../hooks/usePurchasesPaginated';
import type { PurchaseGet } from '../types/PurchaseGet';

const getColumnVisibilityKey = (userName: string) =>
  `purchase-columns-${userName}`;

const PurchaseListScreen = () => {
  const [isInfiniteScroll, setIsInfiniteScroll] = useState(false);
  const { selectedBranchId } = useBranchStore();
  const navigate = useNavigate();
  const user = authSDK.getCurrentUser();
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const { filters, updateFilter, setPage, resetFilters } = usePurchaseFilters(
    Number(selectedBranchId) || 1
  );  

  const {
    data: purchaseData,
    isLoading,
    error,
    isFetching,
    isError,
    refetch: refetchPurchases,
    isRefetching: isRefetchingPurchases,
  } = usePurchasesPaginated(filters);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [purchases, setPurchases] = useState<PurchaseGet[]>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [searchKeywords, setSearchKeywords] = useState('');
  const [debouncedSearchKeywords] = useDebounce(searchKeywords, 500);

  useEffect(() => {
    updateFilter('keywords', debouncedSearchKeywords);
  }, [debouncedSearchKeywords]);

  useEffect(() => {
    updateFilter('sucursal', Number(selectedBranchId));
  }, [selectedBranchId]);

  // Limpiar datos cuando se cambie el modo de scroll infinito
  useEffect(() => {
    if (!isInfiniteScroll) {
      setPurchases([]);
      setPage(1);
    }
  }, [isInfiniteScroll]);

  useEffect(() => {
    if (!user?.name) return;
    const COLUMN_VISIBILITY_KEY = getColumnVisibilityKey(user.name);
    const savedVisibility = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (savedVisibility) {
      try {
        const parsed = JSON.parse(savedVisibility);
        setColumnVisibility(parsed);
      } catch (error) {
        console.error('Error parsing column visibility:', error);
        localStorage.removeItem(COLUMN_VISIBILITY_KEY);
      }
    }
  }, [user?.name]);

  useEffect(() => {
    if (!user?.name || Object.keys(columnVisibility).length === 0) return;
    const COLUMN_VISIBILITY_KEY = getColumnVisibilityKey(user.name);
    try {
      localStorage.setItem(
        COLUMN_VISIBILITY_KEY,
        JSON.stringify(columnVisibility)
      );
    } catch (error) {
      console.error('Error saving column visibility:', error);
    }
  }, [columnVisibility, user?.name]);
  // console.log(authSDK.getAccessToken());
  useEffect(() => {
    // console.log('Filtros actualizados:', filters);
    if (!purchaseData?.data || error) return;

    if (isInfiniteScroll && filters.pagina && filters.pagina > 1) {
      setPurchases(prev => {
        // Evitar duplicados
        const newPurchases = purchaseData.data.filter(
          newPurchase =>
            !prev.some(
              existingPurchase => existingPurchase.id === newPurchase.id
            )
        );
        return [...prev, ...newPurchases];
      });
    } else {
      // En modo paginación normal, siempre reemplazar los datos
      setPurchases(purchaseData.data);
    }
  }, [purchaseData?.data, isInfiniteScroll, filters.pagina, error]);

  const handlePurchaseDetail = (purchaseId: number) => {
    navigate(`/dashboard/purchases/${purchaseId}`);
  };

  const {
    showDeleteDialog,
    isDeleting,
    initiateDeletion,
    cancelDeletion,
    confirmDeletion,
  } = usePurchaseDelete();

  const handleDeletePurchase = (purchaseId: number) => {
    initiateDeletion(purchaseId);
  };

  const handleConfirmDelete = async () => {
    const success = await confirmDeletion();
    if (success) {
      refetchPurchases();
    }
  };

  const handleEditPurchase = (purchaseId: number) => {
    navigate(`/dashboard/purchases/${purchaseId}/editar`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return formatCell(dateString);
    }
  };

  const getContextColor = (contexto: string) => {
    if (contexto.includes('Credito')) return 'warning';
    if (contexto.includes('Contado')) return 'success';
    return 'secondary';
  };
  // console.log(authSDK.getAccessToken());
  const columns = useMemo<ColumnDef<PurchaseGet>[]>(
    () => [
      {
        id: 'Select',
        header: ({ table }) => (
          <Checkbox
            className="border border-gray-400"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Seleccionar todo"
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <Checkbox
              className="border border-gray-400"
              checked={row.getIsSelected()}
              onCheckedChange={value => row.toggleSelected(!!value)}
              aria-label="Seleccionar fila"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: true,
        size: 40,
        minSize: 40,
      },
      {
        accessorKey: 'nro_compra',
        header: 'Nro. Compra',
        size: 80,
        minSize: 50,
        enableHiding: false,
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-1">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="size-6 px-0"
                    onClick={e => {
                      e.stopPropagation();
                    }}
                    onKeyDown={e => {
                      if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  onCloseAutoFocus={e => {
                    e.preventDefault();
                  }}
                  align="start"
                  className="w-48"
                >
                  <DropdownMenuItem
                    onKeyDown={e => e.stopPropagation()}
                    onClick={() => handlePurchaseDetail(row.original.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onKeyDown={e => e.stopPropagation()}
                    onClick={() => { }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver comprobantes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onKeyDown={e => e.stopPropagation()}
                    onClick={() => handleEditPurchase(row.original.id)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar compra
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onKeyDown={e => e.stopPropagation()}
                    onClick={() => handleDeletePurchase(row.original.id)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar compra
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col">
              <h3 className="font-medium text-gray-900 leading-tight hover:underline truncate">
                {getValue<string>()}
              </h3>
              <span className="text-xs text-gray-500">
                ID: {row.original.id}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="text-center">
            <div className="font-medium">{formatDate(getValue<string>())}</div>
          </div>
        ),
      },
      {
        accessorKey: 'proveedor',
        header: 'Proveedor',
        size: 200,
        minSize: 180,
        cell: ({ row }) => {
          const proveedor = row.original.proveedor;
          return (
            <div className="space-y-1">
              <div className="font-medium text-blue-600">
                {proveedor.proveedor}
              </div>
              <div className="text-xs text-gray-500">ID: {proveedor.id}</div>
              {proveedor.nit && (
                <div className="text-xs text-gray-500 font-mono">
                  NIT: {proveedor.nit}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'total',
        header: 'Total',
        size: 60,
        minSize: 40,
        cell: ({ getValue }) => (
          <div className="text-right">
            <div className="font-bold text-green-600">
              ${getValue<number>().toFixed(2)}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'contexto',
        header: 'Tipo',
        size: 110,
        minSize: 90,
        cell: ({ getValue }) => {
          const contexto = getValue<string>();
          const [tipo, estado] = contexto.split('|');
          return (
            <div className="space-y-1">
              <Badge variant={getContextColor(contexto)} className="rounded">
                {tipo}
              </Badge>
              <div className="text-xs text-gray-500">{estado}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'comprobantes',
        header: 'Comprobantes',
        size: 100,
        minSize: 80,
        cell: ({ getValue }) => {
          const comprobantes = getValue<string>();
          const comprobantesList = comprobantes
            .split('|')
            .filter(c => c.trim());
          return (
            <div className="flex flex-wrap gap-1">
              {comprobantesList.map((comprobante, index) => {
              const isMediumLong = comprobante.length > 14; // ajusta el umbral si quieres
              return (
                <Badge
                key={index}
                variant="outline"
                className={`text-xs font-mono border-gray-300 ${
                  isMediumLong ? 'basis-full' : 'basis-auto'
                }`}
                >
                {comprobante}
                </Badge>
              );
              })}
            </div>
          );
        },
      },
      {
        accessorKey: 'responsable',
        header: 'Responsable',
        size: 160,
        minSize: 140,
        cell: ({ row }) => {
          const responsable = row.original.responsable;
          if (!responsable) {
            return <div className="text-gray-400 italic">Sin asignar</div>;
          }
          return (
            <div className="space-y-1">
              <div className="font-medium">
                {responsable.nombre} {responsable.apellido_paterno}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                DNI: {responsable.dni}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'comentarios',
        header: 'Comentarios',
        size: 200,
        minSize: 150,
        cell: ({ getValue }) => {
          const comentarios = getValue<string>();
          return (
            <div
              className={`text-xs ${!comentarios ? 'italic text-gray-400' : ''
                }`}
            >
              {formatCell(comentarios, 'Sin comentarios')}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable<PurchaseGet>({
    data: purchases,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    enableRowSelection: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const handleTableClick = () => {
    setIsFocused(true);
  };

  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleRowDoubleClick = (purchase: PurchaseGet) => {
    handlePurchaseDetail(purchase.id);
  };

  const hasSelectedPurchases = Object.keys(rowSelection).length;

  const onPageChange = (page: number) => {
    // console.log('Cambiando a página:', page);
    setPage(page);
  };

  const onShowRowsChange = (rows: number) => {
    updateFilter('pagina_registros', rows);
    updateFilter('pagina', 1);
  };

  const handleRefetchPurchases = () => {
    refetchPurchases();
  };

  const toggleShowFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <main className="min-h-screen max-w-full">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <header className="p-2 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Compras</h1>
          <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2 md:gap-4 grow">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar en comentarios y comprobantes..."
                  value={searchKeywords}
                  onChange={e => setSearchKeywords(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center space-x-2">
                <Switch
                  id="infinite-scroll"
                  checked={isInfiniteScroll}
                  onCheckedChange={checked => {
                    setIsInfiniteScroll(checked);
                    setPage(1);
                  }}
                />
                <Label htmlFor="infinite-scroll">Scroll Infinito</Label>
              </div>

              <Button
                onClick={handleRefetchPurchases}
                variant="outline"
                size="sm"
                disabled={isRefetchingPurchases || isFetching}
                className="w-8"
              >
                <RefreshCcw
                  className={`size-4 ${isRefetchingPurchases || isFetching ? 'animate-spin' : ''
                    }`}
                />
              </Button>

              <Button variant="outline" size="sm" onClick={resetFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
              <Button size={'sm'} onClick={toggleShowFilters}>
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </Button>
            </div>
          </section>
        </header>

        {/* Filtros */}
        {showFilters && (
          <PurchaseFilters filters={filters} updateFilter={updateFilter} />
        )}

        {/* Results Info */}
        <div className="p-2 text-sm text-gray-600 border-b border-gray-200 flex items-center justify-between">
          {isLoading || isFetching ? (
            <span>Cargando...</span>
          ) : isError ? (
            <span className="text-red-600">Error al cargar los datos</span>
          ) : purchases.length > 0 ? (
            isInfiniteScroll ? (
              `Mostrando ${purchases.length} de ${purchaseData?.meta.total || 0} compras`
            ) : (
              `Mostrando ${(purchaseData?.meta.from || 0)} - ${(purchaseData?.meta.to || 0)} de ${purchaseData?.meta.total || 0} compras`
            )
          ) : (
            <span className="text-amber-600">No se encontraron compras para la sucursal actual</span>
          )}

          <div className="flex items-center gap-2">
            <RowsPerPageSelect
              value={filters.pagina_registros ?? 10}
              onChange={onShowRowsChange}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 max-h-96 overflow-y-auto border border-gray-200"
              >
                {table
                  .getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => (
                    <DropdownMenuItem
                      key={column.id}
                      className="flex items-center space-x-2 cursor-pointer"
                      onSelect={e => e.preventDefault()}
                      onClick={() =>
                        column.toggleVisibility(!column.getIsVisible())
                      }
                    >
                      <Checkbox
                        className="border border-gray-400"
                        checked={column.getIsVisible()}
                        onCheckedChange={value =>
                          column.toggleVisibility(!!value)
                        }
                      />
                      <span className="flex-1">
                        {typeof column.columnDef.header === 'string'
                          ? column.columnDef.header
                          : column.id}
                      </span>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {table && hasSelectedPurchases > 0 && (
              <Button size={'sm'} className="relative">
                Acciones
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                >
                  {hasSelectedPurchases}
                </Badge>
              </Button>
            )}
          </div>
        </div>

        {isInfiniteScroll ? (
          <InfiniteScroll
            dataLength={purchases.length}
            next={() => setPage((filters.pagina || 1) + 1)}
            hasMore={purchases.length < (purchaseData?.meta.total || 0)}
            loader={
              <div className="flex items-center justify-center gap-2 text-center p-6 text-xs sm:text-sm text-gray-500 bg-gray-50">
                <Loader2 className="size-4 animate-spin" />
                Cargando más compras...
              </div>
            }
            scrollableTarget="main-scroll-container"
          >
            <CustomizableTable
              table={table}
              isError={isError}
              errorMessage="Ocurrió un error al cargar las compras. Verifica tu conexión o intenta con otra sucursal."
              isLoading={isLoading}
              rows={filters.pagina_registros}
              noDataMessage="No se encontraron compras para la sucursal seleccionada. Prueba cambiar a otra sucursal o ajusta los filtros de búsqueda."
              selectedRowIndex={selectedIndex}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              tableRef={tableRef}
              focused={isFocused}
              keyboardNavigationEnabled={true}
            />
          </InfiniteScroll>
        ) : (
          <ResizableBox direction="vertical" minSize={20}>
            <div className="overflow-auto h-full">
              <div onClick={handleTableClick} className="overflow-x-hidden">
                <CustomizableTable
                  table={table}
                  isError={isError}
                  isFetching={isFetching}
                  isLoading={isLoading}
                  errorMessage="Ocurrió un error al cargar las compras. Verifica tu conexión o intenta con otra sucursal."
                  rows={filters.pagina_registros}
                  noDataMessage="No se encontraron compras para la sucursal seleccionada. Prueba cambiar a otra sucursal o ajusta los filtros de búsqueda."
                  selectedRowIndex={selectedIndex}
                  onRowClick={handleRowClick}
                  onRowDoubleClick={handleRowDoubleClick}
                  tableRef={tableRef}
                  focused={isFocused}
                  keyboardNavigationEnabled={true}
                />
              </div>

              {/* Pagination */}
              {(purchaseData?.data?.length ?? 0) > 0 && (
                <Pagination
                  currentPage={filters.pagina || 1}
                  onPageChange={onPageChange}
                  totalData={purchaseData?.meta.total || 1}
                  onShowRowsChange={onShowRowsChange}
                  showRows={filters.pagina_registros}
                />
              )}
            </div>
          </ResizableBox>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeletePurchaseDialog
        open={showDeleteDialog}
        onClose={cancelDeletion}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </main>
  );
};

export default PurchaseListScreen;
