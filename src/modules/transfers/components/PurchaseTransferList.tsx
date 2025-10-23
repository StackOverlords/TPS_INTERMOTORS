import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Kbd } from '@/components/atoms/kbd';
import { Label } from '@/components/atoms/label';
import CustomizableTable from '@/components/common/CustomizableTable';
import Pagination from '@/components/common/pagination';
import PopoverDatePicker from '@/components/common/PopoverDatePicker';
import { TooltipWrapper } from '@/components/common/TooltipWrapper';
import { useCustomTable } from '@/hooks/useCustomTable';
import { usePurchaseFilters } from '@/modules/purchases/hooks/usePurchaseFilters';
import { usePurchasesPaginated } from '@/modules/purchases/hooks/usePurchasesPaginated';
import type { PurchaseGet } from '@/modules/purchases/types/PurchaseGet';
import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { formatCurrency } from '@/utils/formaters';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, Clock, Plus, RotateCcw, Search, Zap } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

type BaseWithId = { purchase_id: number };

interface PurchaseTransferListProps<T extends BaseWithId> {
  selectedPurchases: T[];
  onPurchaseSelect: (purchase: PurchaseGet) => void;
  defaultSearchMode?: 'realtime' | 'manual';
}

function PurchaseTransferList<T extends BaseWithId>({
  selectedPurchases,
  onPurchaseSelect,
  defaultSearchMode = 'manual',
}: PurchaseTransferListProps<T>) {
  const { selectedBranchId } = useBranchStore();
  const user = authSDK.getCurrentUser();

  // Estado para el modo de búsqueda
  const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>(
    defaultSearchMode
  );
  const [dateError, setDateError] = useState<string | null>(null);

  const { filters, updateFilter, setPage, resetFilters } = usePurchaseFilters(
    Number(selectedBranchId) || 1
  );

  const [keywords, setKeywords] = useState<string>('');
  const [appliedKeywords, setAppliedKeywords] = useState<string>('');
  const [debouncedKeywords] = useDebounce(keywords, 500);

  // Determinar qué keywords usar según el modo
  const activeKeywords =
    searchMode === 'realtime' ? debouncedKeywords : appliedKeywords;

  const {
    data: purchasesData,
    isLoading,
    isError,
    isFetching,
  } = usePurchasesPaginated({
    ...filters,
    keywords: activeKeywords,
  });

  // Obtener productos y meta información
  const purchases = purchasesData?.data || [];
  const totalPurchases = purchasesData?.meta?.total || 0;

  // Verificar si una compra ya está seleccionada
  const isPurchaseSelected = useCallback(
    (purchaseId: number) => {
      const item = selectedPurchases.find(p => p.purchase_id === purchaseId);

      return {
        isSelected: !!item,
        item,
      };
    },
    [selectedPurchases]
  );

  // Manejar búsqueda manual
  const handleManualSearch = () => {
    if (searchMode === 'manual') {
      setAppliedKeywords(keywords);
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    resetFilters();
    setKeywords('');
    setAppliedKeywords('');
    setDateError(null);
  };

  // Toggle del modo de búsqueda
  const toggleSearchMode = () => {
    setSearchMode(prev => {
      const newMode = prev === 'realtime' ? 'manual' : 'realtime';
      // Si cambiamos a manual, limpiar las keywords aplicadas
      if (newMode === 'manual') {
        setAppliedKeywords('');
      }
      return newMode;
    });
  };

  const columns = useMemo<ColumnDef<PurchaseGet>[]>(
    () => [
      {
        accessorKey: 'nro_compra',
        header: 'Nro. Compra',
        size: 140,
        minSize: 110,
        enableHiding: false,
        cell: ({ row, getValue }) => {
          const id = row.original.id;
          const { isSelected } = isPurchaseSelected(id);
          return (
            <div className="flex justify-between gap-1.5">
              <TooltipWrapper
                tooltipContentProps={{
                  align: 'start',
                }}
                tooltip={
                  <p className="flex gap-1">
                    Presiona <Kbd>enter</Kbd> para ver los detalles de la compra
                  </p>
                }
              >
                <div className="space-y-1 flex flex-col">
                  <span className="font-medium text-foreground">
                    {getValue<string>()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ID: {id}
                  </span>
                </div>
              </TooltipWrapper>
              {isSelected && (
                <div className="flex items-start">
                  <Badge className="text-[10px] px-1" variant={'accent'}>
                    Seleccionado
                  </Badge>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => {
          const dateString = getValue<string>();

          try {
            const date = new Date(dateString);
            const isToday =
              format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <div className="text-center text-xs">
                <div
                  className={`font-medium ${
                    isToday ? 'text-blue-600' : 'text-foreground'
                  }`}
                >
                  {format(date, 'dd/MM/yyyy', { locale: es })}
                </div>
                <div className="text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="size-3" />
                  {format(date, 'HH:mm', { locale: es })}
                </div>
              </div>
            );
          } catch {
            return (
              <span className="text-xs text-muted-foreground">
                {dateString}
              </span>
            );
          }
        },
      },
      {
        accessorKey: 'proveedor',
        header: 'Proveedor',
        size: 250,
        minSize: 200,
        cell: ({ row }) => {
          const proveedor = row.original.proveedor;
          return (
            <div className="space-y-1 flex flex-col">
              <span
                className={`${
                  !proveedor
                    ? 'italic text-muted-foreground'
                    : 'font-medium text-foreground'
                }`}
              >
                {proveedor?.proveedor || 'Sin proveedor'}
              </span>
              {proveedor && proveedor.nit && (
                <div className="text-xs text-muted-foreground">
                  NIT: {proveedor.nit}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'contexto',
        header: 'Contexto',
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => {
          const contexto = getValue<string>();
          const [tipo, categoria] = contexto.split('|');
          return (
            <div className="space-y-1 flex flex-col">
              <Badge variant={'info'} className="text-[10px] w-max">
                {tipo}
              </Badge>
              <div className="text-xs text-muted-foreground">{categoria}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'total',
        header: 'Total',
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="text-right font-medium text-green-600">
            {formatCurrency(getValue<number>())}
          </div>
        ),
      },
      {
        accessorKey: 'comprobantes',
        header: 'Comprobantes',
        size: 140,
        minSize: 120,
        cell: ({ getValue }) => {
          const comprobantes = getValue<string>();

          if (
            !comprobantes ||
            comprobantes.trim() === '' ||
            comprobantes === '|'
          ) {
            return (
              <div className="text-center">
                <span className="text-muted-foreground italic text-xs">
                  Sin comprobantes
                </span>
              </div>
            );
          }

          const [comprobante1, comprobante2] = comprobantes
            .split('|')
            .map(comp => comp.trim())
            .filter(comp => comp !== '');

          return (
            <div className="flex flex-col space-y-0.5 text-xs text-foreground items-center">
              {comprobante1 && (
                <Badge
                  variant={'secondary'}
                  className="flex justify-center w-full text-[10px] rounded py-0.5"
                >
                  {comprobante1}
                </Badge>
              )}
              {comprobante2 && (
                <Badge
                  variant={'secondary'}
                  className="flex justify-center w-full text-[10px] rounded py-0.5"
                >
                  {comprobante2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        size: 90,
        cell: ({ row }) => {
          const purchase = row.original;
          return (
            <Button
              type="button"
              size="sm"
              variant={'default'}
              onClick={() => onPurchaseSelect(purchase)}
              className="h-7 text-xs"
            >
              <Plus className="size-3" />
              Agregar
            </Button>
          );
        },
      },
    ],
    [onPurchaseSelect, isPurchaseSelected]
  );

  const { table } = useCustomTable({
    data: purchases,
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,
    columnResizeMode: 'onChange',
    persistenceKey: `transfers-purchase-select-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  // Manejadores de paginación
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleShowRowsChange = (rows: number) => {
    updateFilter('pagina_registros', rows);
  };

  // Función auxiliar para formatear fecha
  const formatDateSafe = (date: Date): string => {
    try {
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Función para convertir string a Date
  const stringToDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header con Filtros */}
      <div className="p-3 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            Buscar Compras
          </h3>
          <div className="flex gap-2">
            {/* Toggle de modo de búsqueda */}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={toggleSearchMode}
              className="h-8 text-xs"
              title={
                searchMode === 'realtime'
                  ? 'Cambiar a búsqueda manual'
                  : 'Cambiar a búsqueda en tiempo real'
              }
            >
              <Zap
                className={`h-3 w-3 mr-1 ${
                  searchMode === 'realtime'
                    ? 'text-yellow-500'
                    : 'text-gray-500'
                }`}
              />
              {searchMode === 'realtime' ? 'Tiempo real' : 'Manual'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="h-8 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
            {/* Botón de búsqueda solo visible en modo manual */}
            {searchMode === 'manual' && (
              <Button
                type="button"
                size="sm"
                onClick={handleManualSearch}
                className="h-8 text-xs"
              >
                <Search className="h-3 w-3 mr-1" />
                Buscar
              </Button>
            )}
          </div>
        </div>

        {/* Filtros en Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <Label htmlFor="search-keywords" className="text-xs font-medium">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search-keywords"
                placeholder="Comentarios, comprobantes..."
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 col-span-1">
            <Label htmlFor="fecha-inicio" className="text-xs font-medium">
              Fecha Inicio
            </Label>
            <PopoverDatePicker
              value={stringToDate(filters.fecha_inicio)}
              onChange={date => {
                setDateError(null);
                if (
                  date &&
                  filters.fecha_fin &&
                  date > new Date(filters.fecha_fin)
                ) {
                  setDateError(
                    'La fecha de inicio no puede ser posterior a la fecha de fin'
                  );
                  return;
                }
                updateFilter(
                  'fecha_inicio',
                  date ? formatDateSafe(date) : undefined
                );
              }}
              disabled={date => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const fechaFin = filters.fecha_fin
                  ? new Date(filters.fecha_fin)
                  : undefined;
                if (fechaFin && date > fechaFin) return true;
                return date > today;
              }}
              hasError={dateError}
            />
          </div>

          <div className="flex flex-col gap-1.5  col-span-1">
            <Label htmlFor="fecha-fin" className="text-xs font-medium">
              Fecha Fin
            </Label>
            <PopoverDatePicker
              value={stringToDate(filters.fecha_fin)}
              onChange={date => {
                setDateError(null);
                if (
                  date &&
                  filters.fecha_inicio &&
                  date < new Date(filters.fecha_inicio)
                ) {
                  setDateError(
                    'La fecha de fin no puede ser anterior a la fecha de inicio'
                  );
                  return;
                }
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (date && date > today) {
                  setDateError('No se pueden seleccionar fechas futuras');
                  return;
                }
                updateFilter(
                  'fecha_fin',
                  date ? formatDateSafe(date) : undefined
                );
              }}
              disabled={date => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (date > today) return true;
                const fechaInicio = filters.fecha_inicio
                  ? new Date(filters.fecha_inicio)
                  : undefined;
                if (fechaInicio && date < fechaInicio) return true;
                return false;
              }}
              hasError={dateError}
            />
          </div>
          <div className="lg:col-span-2 flex gap-3">
            <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium opacity-0">Acción</Label>
            <Button
              variant="outline"
              type="button"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today);
                lastWeek.setDate(today.getDate() - 7);
                updateFilter('fecha_inicio', formatDateSafe(lastWeek));
                updateFilter('fecha_fin', formatDateSafe(today));
              }}
              className="h-9 text-xs w-full"
            >
              Última semana
            </Button>
          </div>
          <div className="flex flex-col gap-1.5 col-span-1">
            <Label className="text-xs font-medium opacity-0">Acción</Label>
            <Button
              variant="outline"
              type="button"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today);
                lastMonth.setMonth(today.getMonth() - 1);
                setDateError(null);
                updateFilter('fecha_inicio', formatDateSafe(lastMonth));
                updateFilter('fecha_fin', formatDateSafe(today));
              }}
              className="h-9 text-xs w-full"
            >
              Último mes
            </Button>
          </div>
        </div>
          </div>

        {/* Mostrar error de validación */}
        {dateError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{dateError}</span>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        {purchases.length > 0 ? (
          <CustomizableTable
            table={table}
            isLoading={isLoading}
            isError={isError}
            isFetching={isFetching}
            rows={filters.pagina_registros}
            errorMessage="Ocurrió un error al cargar las compras"
            noDataMessage="No se encontraron compras"
          />
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No se encontraron compras
          </div>
        )}
      </div>

      {/* Footer con Paginación */}
      {purchases.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <Pagination
            currentPage={filters.pagina || 1}
            onPageChange={handlePageChange}
            totalData={totalPurchases}
            onShowRowsChange={handleShowRowsChange}
            showRows={filters.pagina_registros || 10}
          />
        </div>
      )}
    </div>
  );
}

export default PurchaseTransferList;
