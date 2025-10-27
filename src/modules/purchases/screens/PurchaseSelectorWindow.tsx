import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import ResizableBox from '@/components/atoms/resizable-box';
import CustomizableTable from '@/components/common/CustomizableTable';
import Pagination from '@/components/common/pagination';
import PopoverDatePicker from '@/components/common/PopoverDatePicker';
import { useCustomTable } from '@/hooks/useCustomTable';
import { usePurchaseFilters } from '@/modules/purchases/hooks/usePurchaseFilters';
import { usePurchasesPaginated } from '@/modules/purchases/hooks/usePurchasesPaginated';
import type { PurchaseGet } from '@/modules/purchases/types/PurchaseGet';
import { useBranchStore } from '@/states/branchStore';
import { formatCurrency } from '@/utils/formaters';
import { emitToWindow } from '@/utils/tauriWindows';
import { type ColumnDef } from '@tanstack/react-table';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, Plus, RotateCcw, Search, X, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

const PurchaseSelectorWindow: React.FC = () => {
  const currentWindow = getCurrentWebviewWindow();
  const { selectedBranchId } = useBranchStore();

  // Extraer config de URL
  const config = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      windowId: params.get('windowId') || 'purchase-selector-default',
      context: params.get('context') || 'transfer',
      onlyWithStock: params.get('onlyWithStock') === 'true',
    };
  }, []);

  const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>('manual');
  const [dateError, setDateError] = useState<string | null>(null);

  const { filters, updateFilter, setPage, resetFilters } = usePurchaseFilters(
    Number(selectedBranchId) || 1
  );

  const [keywords, setKeywords] = useState<string>('');
  const [appliedKeywords, setAppliedKeywords] = useState<string>('');
  const [debouncedKeywords] = useDebounce(keywords, 500);

  const activeKeywords = searchMode === 'realtime' ? debouncedKeywords : appliedKeywords;

  const {
    data: purchasesData,
    isLoading,
    isError,
    isFetching,
  } = usePurchasesPaginated({
    ...filters,
    keywords: activeKeywords,
  });

  const purchases = purchasesData?.data || [];

  // Manejar selección de compra
  const handleSelectPurchase = async (purchase: PurchaseGet) => {
    await emitToWindow(config.windowId, 'purchase-selected', purchase);
    await currentWindow.close();
  };

  const handleClose = async () => {
    await emitToWindow(config.windowId, 'window-closed', { canceled: true });
    await currentWindow.close();
  };

  const handleManualSearch = () => {
    if (searchMode === 'manual') {
      setAppliedKeywords(keywords);
    }
  };

  const toggleSearchMode = () => {
    setSearchMode(prev => (prev === 'realtime' ? 'manual' : 'realtime'));
  };

  // Columnas
  const columns = useMemo<ColumnDef<PurchaseGet>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
        cell: ({ getValue }) => <div className="text-center font-medium">{getValue<number>()}</div>,
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        size: 120,
        cell: ({ getValue }) => {
          const fecha = getValue<string>();
          return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
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
                className={`$${'{'}
                  !proveedor
                    ? 'italic text-muted-foreground'
                    : 'font-medium text-foreground'
                ${'}'}`}
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
        accessorKey: 'nro_factura',
        header: 'N° Factura',
        size: 120,
      },
      {
        accessorKey: 'total',
        header: 'Total',
        size: 120,
        cell: ({ getValue }) => formatCurrency(getValue<number>()),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        size: 100,
        cell: ({ getValue }) => {
          const estado = getValue<string>();
          const variant =
            estado === 'APROBADO' ? 'success' : estado === 'PENDIENTE' ? 'warning' : 'default';
          return <Badge variant={variant}>{estado}</Badge>;
        },
      },
      {
        id: 'acciones',
        header: 'Acción',
        size: 120,
        cell: ({ row }) => (
          <Button size="sm" onClick={() => handleSelectPurchase(row.original)} className="gap-2">
            <Plus className="h-4 w-4" />
            Seleccionar
          </Button>
        ),
      },
    ],
    [handleSelectPurchase]
  );

  const { table } = useCustomTable({
    data: purchases,
    columns,
    enableSorting: false,
    enableColumnResizing: true,
    enableRowSelection: false,
    persistenceKey: `purchase-selector-${config.context}`,
  });

  return (
    <main className="h-screen flex flex-col">
      <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col">
        {/* Header */}
        <header className="p-2 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold text-primary">Seleccionar Compra - {config.context}</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={toggleSearchMode} className="text-xs h-7">
                <Zap className={`h-3 w-3 ${searchMode === 'realtime' ? 'text-yellow-500' : 'text-gray-500'}`} />
                {searchMode === 'realtime' ? 'Tiempo real' : 'Manual'}
              </Button>
              <Button onClick={handleClose} size="sm" variant="ghost">
                <X className="h-4 w-4" />
                Cerrar
              </Button>
            </div>
          </div>
        </header>

        {/* Filtros */}
        <div className="p-2 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <Label className="text-xs">Buscar</Label>
              <div className="flex gap-1">
                <Input
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="Buscar por proveedor, factura..."
                  className="text-xs h-8"
                />
                {searchMode === 'manual' && (
                  <Button onClick={handleManualSearch} size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs">Desde</Label>
              <PopoverDatePicker
                value={filters.fecha_desde ? new Date(filters.fecha_desde) : undefined}
                onChange={date => updateFilter('fecha_desde', date ? format(date, 'yyyy-MM-dd') : '')}
              />
            </div>
            <div>
              <Label className="text-xs">Hasta</Label>
              <PopoverDatePicker
                date={filters.fecha_hasta ? new Date(filters.fecha_hasta) : undefined}
                onChange={date => updateFilter('fecha_hasta', date ? format(date, 'yyyy-MM-dd') : '')}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
          {dateError && (
            <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {dateError}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2 text-sm text-gray-600 border-b border-gray-200">
          {purchases.length > 0 ? `Mostrando ${purchases.length} compras` : 'Cargando...'}
        </div>

        {/* Tabla */}
        <ResizableBox direction="vertical" minSize="100px" initialSize="400px">
          <div className="overflow-auto h-full">
            <div className="overflow-x-hidden">
              <CustomizableTable
                table={table}
                isError={isError}
                isFetching={isFetching}
                isLoading={isLoading}
                errorMessage="Error al cargar compras"
                noDataMessage="No se encontraron compras"
              />
            </div>
            {(purchasesData?.data?.length ?? 0) > 0 && (
              <Pagination
                currentPage={filters.pagina || 1}
                onPageChange={setPage}
                totalData={purchasesData?.meta.total || 1}
                showRows={filters.pagina_registros}
              />
            )}
          </div>
        </ResizableBox>
      </div>
    </main>
  );
};

export default PurchaseSelectorWindow;