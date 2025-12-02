import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import CustomizableTable from '@/components/common/CustomizableTable';
import Pagination from '@/components/common/pagination';
import { formatCurrency } from '@/utils/formaters';
import {
    type ColumnDef,
} from '@tanstack/react-table';
import { AlertCircle, Clock, Phone, Plus, RotateCcw, Search, Zap } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useBranchStore } from '@/states/branchStore';
import type { SaleGetAll } from '@/modules/sales/types/salesGetResponse';
import { TooltipWrapper } from '@/components/common/TooltipWrapper';
import { Kbd } from '@/components/atoms/kbd';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSalesFilters } from '@/modules/sales/hooks/useSalesFilters';
import { useSalesPaginated } from '@/modules/sales/hooks/useSalesPaginated';
import { useCustomTable } from '@/hooks/useCustomTable';
import authSDK from '@/services/sdk-simple-auth';
import { useDebounce } from 'use-debounce';
import { useSaleCustomers } from '@/modules/sales/hooks/useSaleCustomers';
import { PaginatedCombobox } from '@/components/common/paginatedCombobox';
import PopoverDatePicker from '@/components/common/PopoverDatePicker';

type BaseWithId = { sale_id: number };

interface SaleReturnListProps<T extends BaseWithId> {
    selectedSales: T[];
    onSaleSelect: (sale: SaleGetAll) => void;
    defaultSearchMode?: 'realtime' | 'manual';
    onlySelectWithStock?: boolean;
}

function SaleReturnList<T extends BaseWithId>({
    selectedSales,
    onSaleSelect,
    defaultSearchMode = 'manual',
    onlySelectWithStock = false,
}: SaleReturnListProps<T>) {
    // Estado para el modo de búsqueda
    const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>(defaultSearchMode);
    const [dateError, setDateError] = useState<string | null>(null);

    const { selectedBranchId } = useBranchStore();
    const user = authSDK.getCurrentUser()

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
    } = useSalesFilters(Number(selectedBranchId));

    // Obtener datos de filtros
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");

    // Debounce
    const [debouncedCustomerSearchTerm] = useDebounce<string>(customerSearchTerm, 500)

    const {
        data: saleCustomersData,
        isLoading: isSaleCustomersLoading
    } = useSaleCustomers(debouncedCustomerSearchTerm)

    // Determinar qué filtros usar según el modo
    const activeFilters = searchMode === 'realtime' ? debouncedFilters : appliedFilters;

    const {
        data: salesData,
        isLoading,
        isError,
        isFetching,
    } = useSalesPaginated(activeFilters);

    // Obtener productos y meta información
    const sales = salesData?.data || [];
    const totalSales = salesData?.meta?.total || 0;

    // Verificar si un producto ya está seleccionado
    const isSaleSelected = useCallback(
        (saleId: number) => {
            const item = selectedSales.find(
                s => (s.sale_id === saleId)
            );

            return {
                isSelected: !!item,
                item,
            };
        },
        [selectedSales]
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

    const columns = useMemo<ColumnDef<SaleGetAll>[]>(
        () => [
            {
                accessorKey: "nro_venta",
                header: "Nro. Venta",
                size: 140,
                minSize: 110,
                enableHiding: false,
                cell: ({ row, getValue }) => {
                    const id = row.original.id
                    const {
                        isSelected
                    } = isSaleSelected(id)
                    return (
                        <div
                            className="flex justify-between gap-1.5">
                            <TooltipWrapper
                                tooltipContentProps={{
                                    align: 'start'
                                }}
                                tooltip={
                                    <p className="flex gap-1">Presiona <Kbd>enter</Kbd> para ver los detalles de la venta</p>
                                }
                            >
                                <div className="space-y-1 flex flex-col">
                                    <span className="font-medium text-foreground">{getValue<string>()}</span>
                                    <span className="text-xs text-muted-foreground">ID: {id}</span>
                                </div>
                            </TooltipWrapper>
                            {
                                isSelected &&
                                <div className='flex items-start'>
                                    <Badge className='text-[10px] px-1 ' variant={'accent'}>
                                        Seleccionado
                                    </Badge>
                                </div>
                            }
                        </div>
                    )
                },
            },
            {
                accessorKey: "fecha",
                header: "Fecha",
                size: 120,
                minSize: 100,
                cell: ({ getValue }) => {
                    const dateString = getValue<string>();

                    try {
                        const date = new Date(dateString);
                        const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                        return (
                            <div className="text-center text-xs">
                                <div className={`font-medium ${isToday ? 'text-blue-600' : 'text-foreground'}`}>
                                    {format(date, "dd/MM/yyyy", { locale: es })}
                                </div>
                                <div className="text-muted-foreground flex items-center justify-center gap-1">
                                    <Clock className="size-3" />
                                    {format(date, "HH:mm", { locale: es })}
                                </div>
                            </div>
                        );
                    } catch {
                        return <span className="text-xs text-muted-foreground">{dateString}</span>;
                    }
                },
            },
            {
                accessorKey: "cliente",
                header: "Cliente",
                size: 250,
                minSize: 200,
                cell: ({ row }) => {
                    const cliente = row.original.cliente;
                    return (
                        <div className="space-y-1 flex flex-col">
                            <span className={`${!cliente ? "italic text-muted-foreground" : "font-medium text-foreground"}`}>
                                {cliente?.cliente || "Sin cliente"}
                            </span>
                            {
                                cliente &&
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                    {cliente.nit && <div>NIT: {cliente.nit}</div>}
                                    {cliente.contacto &&
                                        <div className="flex items-center gap-1">
                                            <Phone className="size-3" />
                                            {cliente.contacto}
                                        </div>}
                                </div>
                            }
                        </div>
                    );
                },
            },
            {
                accessorKey: "contexto",
                header: "Contexto",
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
                accessorKey: "total",
                header: "Total",
                size: 120,
                minSize: 100,
                cell: ({ getValue }) => (
                    <div className="text-right font-medium text-green-600">
                        {formatCurrency(getValue<number>())}
                    </div>
                ),
            },
            {
                accessorKey: "comprobantes",
                header: "Comprobantes",
                size: 140,
                minSize: 120,
                cell: ({ getValue }) => {
                    const comprobantes = getValue<string>();

                    if (!comprobantes || comprobantes.trim() === "" || comprobantes === "|") {
                        return (
                            <div className="text-center">
                                <span className="text-muted-foreground italic text-xs">
                                    Sin comprobantes
                                </span>
                            </div>
                        );
                    }

                    const [comprobante1, comprobante2] = comprobantes
                        .split("|")
                        .map(comp => comp.trim())
                        .filter(comp => comp !== "");

                    return (
                        <div className="flex flex-col space-y-0.5 text-xs text-foreground items-center">
                            {comprobante1 && (
                                <Badge variant={'secondary'} className="flex justify-center w-full text-[10px] rounded py-0.5">{comprobante1}</Badge>
                            )}
                            {comprobante2 && (
                                <Badge variant={'secondary'} className="flex justify-center w-full text-[10px] rounded py-0.5">{comprobante2}</Badge>
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
                    const sale = row.original
                    return (
                        <Button
                            type='button'
                            size="sm"
                            variant={'default'}
                            onClick={() => onSaleSelect(sale)}
                            className='h-7 text-xs'
                        >

                            <Plus className="size-3" />
                            Agregar
                        </Button>
                    );
                },
            },
        ],
        [onSaleSelect, onlySelectWithStock]
    );

    const {
        table,
        // resetAll,
    } = useCustomTable({
        data: sales,
        columns,

        // Configuración de características
        enableSorting: true,
        enableColumnResizing: true,
        enableRowSelection: true,
        enableColumnVisibility: true,
        enableColumnOrdering: true,
        enablePagination: false,

        // Configuración de resize
        columnResizeMode: "onChange",

        // Persistencia con key única por usuario
        persistenceKey: `returns-select-table-${user?.name}`,
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    // Manejadores de paginación
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleShowRowsChange = (rows: number) => {
        setPageSize(rows)
    };

    // Función auxiliar para formatear fecha de manera segura
    const formatDateSafe = (date: Date): string => {
        try {
            return format(date, 'yyyy-MM-dd');
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    const handleFechaInicioChange = (date: Date | undefined) => {
        setDateError(null); // Limpiar errores anteriores

        if (date) {
            // Validar que la fecha inicio no sea posterior a fecha fin
            if (filters.fecha_fin && date > filters.fecha_fin) {
                setDateError('La fecha de inicio no puede ser posterior a la fecha de fin');
                return;
            }
        }

        updateFilter('fecha_inicio', date ? formatDateSafe(date) : undefined);
    };

    const handleFechaFinChange = (date: Date | undefined) => {
        setDateError(null); // Limpiar errores anteriores

        if (date) {

            // Validar que la fecha fin no sea anterior a fecha inicio
            if (filters.fecha_inicio && date < filters.fecha_inicio) {
                setDateError('La fecha de fin no puede ser anterior a la fecha de inicio');
                return;
            }

            // Validar que la fecha no sea futura (opcional, según tu caso de uso)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date > today) {
                setDateError('No se pueden seleccionar fechas futuras');
                return;
            }
        }

        updateFilter('fecha_fin', date ? formatDateSafe(date) : undefined);
    };

    return (
        <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            {/* Header con Filtros */}
            <div className="p-2 border-b border-border space-y-1">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-primary">
                            Buscar Ventas
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
                </header>

                {/* Filtros en Grid */}
                <section className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                        <div className="space-y-2">
                            <Label>Nro. de Venta</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    type="number"
                                    placeholder="Ej: 2054"
                                    value={filters.codigo_interno ?? ''}
                                    onChange={(e) => updateFilter("codigo_interno", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                    className="pl-10 font-mono text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Cliente</Label>
                            <PaginatedCombobox
                                value={filters.cliente}
                                onChange={(value) => updateFilter("cliente", value && typeof value === "string" ? parseInt(value, 10) : undefined)}
                                optionsData={saleCustomersData?.data || []}
                                displayField="nombre"
                                enableAllOption={true}
                                allOptionLabel="TODOS"
                                isLoading={isSaleCustomersLoading}
                                updatePage={(page) => { console.log("Update page:", page) }}
                                updateSearch={setCustomerSearchTerm}
                                metaData={
                                    {
                                        current_page: saleCustomersData?.meta.current_page || 1,
                                        last_page: saleCustomersData?.meta.last_page || 1,
                                        total: saleCustomersData?.meta.total || 0,
                                        per_page: saleCustomersData?.meta.per_page || 10,
                                    }
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Código OEM</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="11122-10040-D..."
                                    value={filters.codigo_oem_producto}
                                    onChange={(e) => updateFilter("codigo_oem_producto", e.target.value)}
                                    className="pl-10 font-mono text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 w-full">
                            <Label>Fecha Inicio</Label>
                            <div className="flex gap-2">
                                <PopoverDatePicker
                                    value={filters.fecha_inicio}
                                    onChange={(date) => handleFechaInicioChange(date)}
                                    hasError={dateError}
                                    disabled={(date) => {
                                        // Deshabilitar fechas futuras
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);

                                        const fechaFin = filters.fecha_fin ? new Date(filters.fecha_fin) : undefined;
                                        if (fechaFin && date > fechaFin) return true;
                                        return date > today;
                                    }}
                                />
                            </div>
                        </div>

                        {/* Fecha Fin */}
                        <div className="space-y-2 w-full">
                            <Label>Fecha Fin</Label>
                            <div className="flex gap-2">
                                <PopoverDatePicker
                                    value={filters.fecha_fin}
                                    onChange={(date) => handleFechaFinChange(date)}
                                    hasError={dateError}
                                    disabled={(date) => {
                                        // Deshabilitar fechas futuras
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        if (date > today) return true;

                                        const fechaInicio = filters.fecha_inicio ? new Date(filters.fecha_inicio) : undefined;
                                        // Deshabilitar fechas anteriores a la fecha de inicio
                                        if (fechaInicio && date < fechaInicio) return true;

                                        return false;
                                    }}
                                />
                            </div>
                        </div>

                        {/* Botones de acción adicionales */}
                        <div className="flex gap-2 items-end">

                            {/* Botón para establecer rango de última semana */}
                            <Button
                                variant="outline"
                                type='button'
                                size="sm"
                                onClick={() => {
                                    const today = new Date();
                                    const lastWeek = new Date(today);
                                    lastWeek.setDate(today.getDate() - 7);

                                    setDateError(null);
                                    updateFilter('fecha_inicio', formatDateSafe(lastWeek));
                                    updateFilter('fecha_fin', formatDateSafe(today));
                                }}
                                className="text-xs"
                            >
                                Última semana
                            </Button>

                            {/* Botón para establecer rango del último mes */}
                            <Button
                                variant="outline"
                                type='button'
                                size="sm"
                                onClick={() => {
                                    const today = new Date();
                                    const lastMonth = new Date(today);
                                    lastMonth.setMonth(today.getMonth() - 1);

                                    setDateError(null);
                                    updateFilter('fecha_inicio', formatDateSafe(lastMonth));
                                    updateFilter('fecha_fin', formatDateSafe(today));
                                }}
                                className="text-xs"
                            >
                                Último mes
                            </Button>
                        </div>

                    </div>

                    {/* Mostrar error de validación */}
                    {dateError && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{dateError}</span>
                        </div>
                    )}

                </section>
            </div>

            {/* Table Container */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full overflow-auto px-2">
                    <CustomizableTable
                        table={table}
                        isLoading={isLoading}
                        isError={isError}
                        isFetching={isFetching}
                        rows={filters.pagina_registros}
                        errorMessage="Ocurrió un error al cargar los productos"
                        noDataMessage={searchMode === 'manual' ? 'Haz clic en "Buscar" para ver los productos' : 'No se encontraron productos'}
                    />
                </div>
            </div>

            {/* Footer con Paginación */}
            {sales.length > 0 && (
                <div className="flex-shrink-0 border-t border-border bg-card">
                    <Pagination
                        currentPage={filters.pagina}
                        onPageChange={handlePageChange}
                        totalData={totalSales}
                        onShowRowsChange={handleShowRowsChange}
                        showRows={filters.pagina_registros}
                    />
                </div>
            )}
        </div>
    );
};

export default SaleReturnList;