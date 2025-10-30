import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useBranchStore } from "@/states/branchStore";
import { AlertCircle, Search, X } from "lucide-react";
import { useState } from "react";
import { useTransferBranches } from "../../hooks/commons/useTransferBranches";
import { useTransferResponsibles } from "../../hooks/commons/useTransferResponsibles";
import type { useTransfersFilters } from "../../hooks/useTransfersFilters";

interface TransferFiltersProps {
    filters: ReturnType<typeof useTransfersFilters>["filters"]
    updateFilter: ReturnType<typeof useTransfersFilters>["updateFilter"]
}

const TransferFiltersComponent: React.FC<TransferFiltersProps> = ({
    filters,
    updateFilter
}) => {
    const [dateError, setDateError] = useState<string | null>(null);
    const { selectedBranchId } = useBranchStore();

    const {
        data: transferResponsiblesData,
        isLoading: isTransferResponsiblesLoading
    } = useTransferResponsibles();

    const {
        data: branchesData,
        isLoading: isBranchesLoading
    } = useTransferBranches(Number(selectedBranchId));

    // Función auxiliar para formatear fecha de manera segura (sin problemas de zona horaria)
    const formatDateSafe = (date: Date): string => {
        try {
            // Usar métodos locales para evitar problemas de timezone
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    // Función para parsear fecha string a Date local
    const parseLocalDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const handleFechaInicioChange = (date: Date | undefined) => {
        setDateError(null); // Limpiar errores anteriores

        if (date) {
            // Validar que la fecha inicio no sea posterior a fecha fin
            if (filters.fecha_fin) {
                const fechaFin = parseLocalDate(filters.fecha_fin);
                if (date > fechaFin) {
                    setDateError('La fecha de inicio no puede ser posterior a la fecha de fin');
                    return;
                }
            }
        }

        updateFilter('fecha_inicio', date ? formatDateSafe(date) : undefined);
    };

    const handleFechaFinChange = (date: Date | undefined) => {
        setDateError(null); // Limpiar errores anteriores

        if (date) {

            // Validar que la fecha fin no sea anterior a fecha inicio
            if (filters.fecha_inicio) {
                const fechaInicio = parseLocalDate(filters.fecha_inicio);
                if (date < fechaInicio) {
                    setDateError('La fecha de fin no puede ser anterior a la fecha de inicio');
                    return;
                }
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
            <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
                <div className="space-y-2">
                    <Label>Nro. de transferencia</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="number"
                            placeholder="Ej: 2054"
                            value={filters.codigo_interno ?? ''}
                            onChange={(e) => updateFilter('codigo_interno', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="pl-10 font-mono text-xs"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Responsable</Label>
                    <ComboboxSelect
                        value={filters.responsable}
                        onChange={(value) => updateFilter("responsable", value && typeof value === "string" ? parseInt(value, 10) : undefined)}
                        options={transferResponsiblesData?.data || []}
                        optionTag={"nombre"}
                        isLoadingData={isTransferResponsiblesLoading}
                        enableAllOption={true}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Sucursal Origen</Label>
                    <ComboboxSelect
                        value={filters.sucursal_origen}
                        onChange={(value) => updateFilter("sucursal_origen", value && typeof value === "string" ? parseInt(value, 10) : undefined)}
                        options={branchesData?.data?.map(branch => ({ id: branch.id, nombre: branch.nombre, sigla: branch.sigla, nombre_comercial: branch.nombre_comercial, activo: branch.activo })) || []}
                        optionTag={"nombre"}
                        isLoadingData={isBranchesLoading}
                        enableAllOption={true}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Sucursal Destino</Label>
                    <ComboboxSelect
                        value={filters.sucursal_destino}
                        onChange={(value) => updateFilter("sucursal_destino", value && typeof value === "string" ? parseInt(value, 10) : undefined)}
                        options={branchesData?.data?.map(branch => ({ id: branch.id, nombre: branch.nombre, sigla: branch.sigla, nombre_comercial: branch.nombre_comercial, activo: branch.activo })) || []}
                        optionTag={"nombre"}
                        isLoadingData={isBranchesLoading}
                        enableAllOption={true}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Código OEM Producto</Label>
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

                {/* Fecha Inicio */}
                <div className="space-y-2">
                    <Label>Fecha Inicio</Label>
                    <PopoverDatePicker
                        value={filters.fecha_inicio ? parseLocalDate(filters.fecha_inicio) : undefined}
                        onChange={(date) => handleFechaInicioChange(date)}
                        hasError={dateError}
                        disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const fechaFin = filters.fecha_fin ? parseLocalDate(filters.fecha_fin) : undefined;
                            if (fechaFin && date > fechaFin) return true;
                            return date > today;
                        }}
                    />
                </div>

                {/* Fecha Fin */}
                <div className="space-y-2">
                    <Label>Fecha Fin</Label>
                    <PopoverDatePicker
                        value={filters.fecha_fin ? parseLocalDate(filters.fecha_fin) : undefined}
                        onChange={(date) => handleFechaFinChange(date)}
                        hasError={dateError}
                        disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (date > today) return true;
                            const fechaInicio = filters.fecha_inicio ? parseLocalDate(filters.fecha_inicio) : undefined;
                            if (fechaInicio && date < fechaInicio) return true;
                            return false;
                        }}
                    />
                </div>

                {/* Botón Limpiar fechas */}
                {(filters.fecha_inicio || filters.fecha_fin) && (
                    <div className="space-y-2">
                        <Label className="opacity-0 pointer-events-none">Acción</Label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllDateFilters}
                            className="text-xs h-8 w-full"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Limpiar
                        </Button>
                    </div>
                )}
            </div>

            {/* Botones de acciones rápidas de fecha - en una fila separada */}
            {/* <div className="flex gap-2 items-center flex-wrap">
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
                    className="text-xs h-8"
                >
                    Última semana
                </Button><Button
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
                    className="text-xs h-8"
                >
                    Último mes
                </Button>
            </div> */}


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

export default TransferFiltersComponent;
