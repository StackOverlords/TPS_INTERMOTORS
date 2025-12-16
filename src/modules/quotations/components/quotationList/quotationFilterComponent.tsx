import { Label } from "@/components/atoms/label";
import { AlertCircle, Search, X } from "lucide-react";
import { Input } from "@/components/atoms/input";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/atoms/button";
import { format } from "date-fns";
// import { PaginatedCombobox } from "@/components/common/paginatedCombobox";
import { useSaleCustomers } from "@/modules/sales/hooks/useSaleCustomers";
import type { useSalesFilters } from "@/modules/sales/hooks/useSalesFilters";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import { ComboboxSelect } from "@/components/common/SelectCombobox";

interface QuotationsFiltersProps {
    filters: ReturnType<typeof useSalesFilters>["filters"]
    updateFilter: ReturnType<typeof useSalesFilters>["updateFilter"]
    searchMode: 'realtime' | 'manual'
    handleManualSearch: () => void
}

const QuotationsFiltersComponent: React.FC<QuotationsFiltersProps> = ({
    filters,
    updateFilter,
    handleManualSearch,
    searchMode,
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

    // Función para limpiar ambas fechas
    const clearAllDateFilters = () => {
        setDateError(null);
        updateFilter('fecha_inicio', undefined);
        updateFilter('fecha_fin', undefined);
    };

    return (
        <section className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                <div className="space-y-2">
                    <Label>Nro. de Cotizacion</Label>
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
                    {/* <PaginatedCombobox
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
                    /> */}
                    <ComboboxSelect
                        value={filters.cliente}
                        onChange={(value) => updateFilter("cliente", value && typeof value === "string" ? parseInt(value, 10) : undefined)}
                        options={saleCustomersData?.data || []}
                        optionTag="nombre"
                        placeholder="Buscar cliente por nombre"
                        className="w-full"
                        enableAllOption={false}
                        onSearch={setCustomerSearchTerm}
                        clearOnEmpty={true}
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
            </div>

            {/* Botones de acción adicionales */}
            <div className="flex gap-2 items-end justify-end flex-wrap">
                {/* Botón de búsqueda solo visible en modo manual */}
                {searchMode === 'manual' && (
                    <Button
                        onClick={handleManualSearch}
                        className="w-full sm:w-auto"
                    >
                        <Search className="size-4" />
                        Buscar
                    </Button>
                )}

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