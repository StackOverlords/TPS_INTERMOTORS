import { Label } from "@/components/atoms/label";
import { AlertCircle, CalendarIcon, Search, X } from "lucide-react";
import { Input } from "@/components/atoms/input";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/atoms/popover";
import { Button } from "@/components/atoms/button";
import { Calendar } from "@/components/atoms/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PaginatedCombobox } from "@/components/common/paginatedCombobox";
import { useSaleCustomers } from "@/modules/sales/hooks/useSaleCustomers";
import type { useSalesFilters } from "@/modules/sales/hooks/useSalesFilters";

interface QuotationsFiltersProps {
    filters: ReturnType<typeof useSalesFilters>["filters"]
    updateFilter: ReturnType<typeof useSalesFilters>["updateFilter"]
}

const QuotationsFiltersComponent: React.FC<QuotationsFiltersProps> = ({
    filters,
    updateFilter
}) => {
    const [dateError, setDateError] = useState<string | null>(null);
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");

    const [debouncedCustomerSearchTerm] = useDebounce<string>(customerSearchTerm, 500)

    const {
        data: saleCustomersData,
        isLoading: isSaleCustomersLoading
    } = useSaleCustomers(debouncedCustomerSearchTerm)


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

    const clearDateFilter = (type: 'inicio' | 'fin') => {
        setDateError(null); // Limpiar errores al resetear

        if (type === 'inicio') {
            updateFilter('fecha_inicio', undefined);
        } else {
            updateFilter('fecha_fin', undefined);
        }
    };

    // Función para limpiar ambas fechas
    const clearAllDateFilters = () => {
        setDateError(null);
        updateFilter('fecha_inicio', undefined);
        updateFilter('fecha_fin', undefined);
    };

    return (
        <section className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="space-y-2">
                    <Label className="text-gray-700 text-sm font-medium">Nro. de Cotizacion</Label>
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
                    <Label className="text-gray-700 text-sm font-medium">Cliente</Label>
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
                    <Label className="text-gray-700 text-sm font-medium">Código OEM Producto</Label>
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
            </div>

            {/* Date Range */}
            <div className="flex justify-between gap-2">
                {/* Fecha Inicio */}
                <div className="flex gap-2 grow">
                    <div className="space-y-2 w-full">
                        <Label className="text-sm font-medium">Fecha Inicio</Label>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size={"sm"}
                                        className={cn(
                                            "flex-1 justify-between text-left font-normal",
                                            !filters.fecha_inicio && "text-muted-foreground",
                                            dateError && "border-red-500 focus:border-red-500"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {filters.fecha_inicio ? format(filters.fecha_inicio, "dd/MM/yyyy") : "Seleccionar fecha"}
                                        </div>
                                        {filters.fecha_inicio && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => clearDateFilter('inicio')}
                                                className="size-6 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:border-red-200"
                                            >
                                                <X className="size-3" />
                                            </Button>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.fecha_inicio}
                                        onSelect={handleFechaInicioChange}
                                        disabled={(date: Date) => {
                                            // Deshabilitar fechas futuras
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            if (filters.fecha_fin && date > filters.fecha_fin) return true;
                                            return date > today;
                                        }}
                                        className="p-3 pointer-events-auto"
                                    />
                                </PopoverContent>
                            </Popover>

                        </div>
                    </div>

                    {/* Fecha Fin */}
                    <div className="space-y-2 w-full">
                        <Label className="text-sm font-medium">Fecha Fin</Label>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size={"sm"}
                                        className={cn(
                                            "flex-1 justify-between text-left font-normal",
                                            !filters.fecha_fin && "text-muted-foreground",
                                            dateError && "border-red-500 focus:border-red-500"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {filters.fecha_fin ? format(filters.fecha_fin, "dd/MM/yyyy") : "Seleccionar fecha"}
                                        </div>
                                        {filters.fecha_fin && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => clearDateFilter('fin')}
                                                className="size-6 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:border-red-200"
                                            >
                                                <X className="size-3" />
                                            </Button>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.fecha_fin}
                                        onSelect={handleFechaFinChange}
                                        disabled={(date: Date) => {
                                            // Deshabilitar fechas futuras
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            if (date > today) return true;

                                            // Deshabilitar fechas anteriores a la fecha de inicio
                                            if (filters.fecha_inicio && date < filters.fecha_inicio) return true;

                                            return false;
                                        }}
                                        className="pointer-events-auto p-3"
                                    />
                                </PopoverContent>
                            </Popover>

                        </div>
                    </div>
                </div>

                {/* Botones de acción adicionales */}
                <div className="flex gap-2 items-end justify-end">
                    {(filters.fecha_inicio || filters.fecha_fin) && (
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

                    {/* Botón para establecer rango de última semana */}
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

                    {/* Botón para establecer rango del último mes */}
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
    );
}

export default QuotationsFiltersComponent;