import { Label } from "@/components/atoms/label";
import { AlertCircle, CalendarIcon, Search, X } from "lucide-react";
import { Input } from "@/components/atoms/input";
import { useEffect, useState } from "react";
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
    // Inputs locales
    const [codigoInterno, setCodigoInterno] = useState<number | undefined>(undefined)
    const [codigoOEM, setCodigoOEM] = useState<string>("")
    const [clientId, setClientId] = useState<number | undefined>(undefined)
    const [fechaInicio, setFechaInicio] = useState<Date | undefined>(
        filters.fecha_inicio ? new Date(filters.fecha_inicio) : undefined
    );
    const [fechaFin, setFechaFin] = useState<Date | undefined>(
        filters.fecha_fin ? new Date(filters.fecha_fin) : undefined
    );
    const [dateError, setDateError] = useState<string | null>(null);
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");

    // Debounce
    const [debouncedCodigoOEM] = useDebounce(codigoOEM, 500)
    const [debouncedCodigoInterno] = useDebounce(codigoInterno, 500)
    const [debouncedClientId] = useDebounce(clientId, 500)
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
            if (fechaFin && date > fechaFin) {
                setDateError('La fecha de inicio no puede ser posterior a la fecha de fin');
                return;
            }
        }

        setFechaInicio(date);
        updateFilter('fecha_inicio', date ? formatDateSafe(date) : undefined);
    };

    const handleFechaFinChange = (date: Date | undefined) => {
        setDateError(null); // Limpiar errores anteriores

        if (date) {

            // Validar que la fecha fin no sea anterior a fecha inicio
            if (fechaInicio && date < fechaInicio) {
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

        setFechaFin(date);
        updateFilter('fecha_fin', date ? formatDateSafe(date) : undefined);
    };

    const clearDateFilter = (type: 'inicio' | 'fin') => {
        setDateError(null); // Limpiar errores al resetear

        if (type === 'inicio') {
            setFechaInicio(undefined);
            updateFilter('fecha_inicio', undefined);
        } else {
            setFechaFin(undefined);
            updateFilter('fecha_fin', undefined);
        }
    };

    // Función para limpiar ambas fechas
    const clearAllDateFilters = () => {
        setDateError(null);
        setFechaInicio(undefined);
        setFechaFin(undefined);
        updateFilter('fecha_inicio', undefined);
        updateFilter('fecha_fin', undefined);
    };
    // Sync debounced values al filtro global
    useEffect(() => {
        updateFilter("codigo_oem_producto", debouncedCodigoOEM)
    }, [debouncedCodigoOEM, updateFilter])

    useEffect(() => {
        updateFilter("codigo_interno", debouncedCodigoInterno)
    }, [debouncedCodigoInterno, updateFilter])

    useEffect(() => {
        updateFilter("cliente", debouncedClientId)
    }, [debouncedClientId, updateFilter])

    useEffect(() => {
        const { codigo_oem_producto, codigo_interno, cliente, fecha_inicio, fecha_fin } = filters;

        const allEmpty = !codigo_oem_producto && !codigo_interno && !cliente && !fecha_inicio && !fecha_fin;

        if (allEmpty) {
            setCodigoOEM("");
            setCodigoInterno(undefined);
            setClientId(undefined);
            setFechaInicio(undefined);
            setFechaFin(undefined);
        }
    }, [filters]);

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
                            value={codigoInterno ?? ''}
                            onChange={(e) => setCodigoInterno(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="pl-10 font-mono text-xs"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-gray-700 text-sm font-medium">Buscar por Cliente</Label>
                    <PaginatedCombobox
                        value={clientId}
                        onChange={(value) => setClientId(value && typeof value === "string" ? parseInt(value, 10) : undefined)}
                        optionsData={saleCustomersData?.data || []}
                        displayField="nombre"
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
                    <Label className="text-gray-700 text-sm font-medium">Buscar Código OEM Producto</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="11122-10040-D..."
                            value={codigoOEM}
                            onChange={(e) => setCodigoOEM(e.target.value)}
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
                                            !fechaInicio && "text-muted-foreground",
                                            dateError && "border-red-500 focus:border-red-500"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {fechaInicio ? format(fechaInicio, "dd/MM/yyyy") : "Seleccionar fecha"}
                                        </div>
                                        {fechaInicio && (
                                            <span className="border border-gray-200 rounded hover:scale-110 transition-all hover:bg-red-200 hover:text-red-400"
                                                onClick={() => clearDateFilter('inicio')}
                                            >
                                                <X className="size-4" />
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={fechaInicio}
                                        onSelect={handleFechaInicioChange}
                                        disabled={(date: Date) => {
                                            // Deshabilitar fechas futuras
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            if (fechaFin && date > fechaFin) return true;
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
                                            !fechaFin && "text-muted-foreground",
                                            dateError && "border-red-500 focus:border-red-500"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {fechaFin ? format(fechaFin, "dd/MM/yyyy") : "Seleccionar fecha"}
                                        </div>
                                        {fechaFin && (
                                            <span className="border border-gray-200 rounded hover:scale-110 transition-all hover:bg-red-200 hover:text-red-400"
                                                onClick={() => clearDateFilter('fin')}
                                            >
                                                <X className="size-4" />
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={fechaFin}
                                        onSelect={handleFechaFinChange}
                                        disabled={(date: Date) => {
                                            // Deshabilitar fechas futuras
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            if (date > today) return true;

                                            // Deshabilitar fechas anteriores a la fecha de inicio
                                            if (fechaInicio && date < fechaInicio) return true;

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
                    {(fechaInicio || fechaFin) && (
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
                            setFechaInicio(lastWeek);
                            setFechaFin(today);
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
                            setFechaInicio(lastMonth);
                            setFechaFin(today);
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