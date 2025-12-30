import { Label } from "@/components/atoms/label";
import { AlertCircle, Search, X } from "lucide-react";
import { Input } from "@/components/atoms/input";
import { useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
// import { PaginatedCombobox } from "@/components/common/paginatedCombobox";
import type { useOrdersFilters } from "../../hooks/useOrdersFilters";
import { useOrderProvider } from "../../hooks/commons/useOrderProviders";
import { useOrderStatus } from "../../hooks/commons/useOrderStatus";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { useViewConfig } from "@/hooks/useViewConfig";

interface OrdersFiltersProps {
    filters: ReturnType<typeof useOrdersFilters>["filters"]
    updateFilter: ReturnType<typeof useOrdersFilters>["updateFilter"]
    searchMode: 'realtime' | 'manual'
    handleManualSearch: () => void
}

const OrdersFiltersComponent: React.FC<OrdersFiltersProps> = ({
    filters,
    updateFilter,
    handleManualSearch,
    searchMode,
}) => {
    const {
        isFeatureEnabled,
    } = useViewConfig('orders-list');

    const [dateError, setDateError] = useState<string | null>(null);

    const {
        data: orderProvidersData,
        isLoading: isOrdersProvidersLoading
    } = useOrderProvider()

    const {
        data: orderStatusData,
        isLoading: isOrderStatusLoading
    } = useOrderStatus()


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

    // Función para limpiar ambas fechas
    const clearAllDateFilters = () => {
        setDateError(null);
        updateFilter('fecha_inicio', undefined);
        updateFilter('fecha_fin', undefined);
    };

    const containerRef = useRef<HTMLDivElement>(null);
    useFormEnterNavigation({
        containerRef: containerRef,
        excludeSelectors: [
            '.editable-cell-input',
            '[data-table-cell="true"]',
            '[name="btn-chvron-right"]',  
        ],
        enabled: true,
    })
    return (
        <section className="space-y-2">
            <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                {
                    isFeatureEnabled('orderNumberFilter') && (
                        <div className="space-y-2">
                            <Label>Nro. de pedido</Label>
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
                    )
                }
                {
                    isFeatureEnabled('providerFilter') && (
                        <div className="space-y-2">
                            <Label>Proveedor</Label>
                            <ComboboxSelect
                                value={filters.proveedor?.toString() || ""}
                                onChange={(value) => updateFilter("proveedor", value && typeof value === "string" ? parseInt(value, 10) : undefined)}
                                options={orderProvidersData?.data || []}
                                optionTag="nombre"
                                placeholder="Buscar proveedor por nombre"
                                className="w-full"
                                // enableAllOption={false}
                                clearOnEmpty={true}
                                // disabled={isOrdersProvidersLoading}
                            />
                        </div>
                    )
                }
                {
                    isFeatureEnabled('productOemFilter') && (
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
                    )
                }
                {
                    isFeatureEnabled('statusFilter') && (
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select
                                defaultValue="all"
                                value={filters.situacion_actual?.toString() || "all"}
                                disabled={isOrderStatusLoading}
                                onValueChange={(val) => {
                                    val === "all" ? updateFilter('situacion_actual', '') :
                                        updateFilter('situacion_actual', val)
                                }}
                            >
                                <SelectTrigger className={cn(
                                    "space-x-2 w-full",
                                )}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={cn(
                                    "shadow-lg",
                                )}>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {orderStatusData?.map(({ id, label }) => (
                                        <SelectItem key={id} value={id}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )
                }
                {
                    isFeatureEnabled('startDateFilter') && (
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
                    )
                }

                {/* Fecha Fin */}
                {
                    isFeatureEnabled('endDateFilter') && (
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
                    )
                }

                {/* Botón de búsqueda solo visible en modo manual */}
                {searchMode === 'manual' && (
                    <div className="h-full flex items-end">
                        <Button
                            onClick={handleManualSearch}
                            className="w-full"
                        >
                            <Search className="size-4" />
                            Buscar
                        </Button>
                    </div>
                )}
            </div>

            {/* Botones de acción adicionales */}
            <div className="flex gap-2 items-end justify-end flex-wrap">

                {((filters.fecha_inicio || filters.fecha_fin) && isFeatureEnabled('clearDatesButton')) && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllDateFilters}
                        className="text-xs"
                    >
                        <X className="h-3 w-3" />
                        Limpiar todas las fechas
                    </Button>
                )}
                {
                    isFeatureEnabled('dateShortcuts') && (
                        <>
                            {/* Botón para establecer rango de última semana */}
                            {
                                isFeatureEnabled('lastWeekShortcut') && (
                                    <Button
                                        variant="outline"
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
                                )
                            }

                            {/* Botón para establecer rango del último mes */}
                            {
                                isFeatureEnabled('lastMonthShortcut') && (
                                    <Button
                                        variant="outline"
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
                                )
                            }
                        </>
                    )
                }
            </div>

            {/* Mostrar error de validación */}
            {dateError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{dateError}</span>
                </div>
            )}

        </section>
    );
}

export default OrdersFiltersComponent;