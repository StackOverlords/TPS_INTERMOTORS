import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useTransferResponsibles } from "../../hooks/commons/useTransferResponsibles";
import type { useTransfersFilters } from "../../hooks/useTransfersFilters";
import { format } from "date-fns";
import { Button } from "@/components/atoms/button";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";

interface TransferFiltersProps {
  filters: ReturnType<typeof useTransfersFilters>["filters"];
  updateFilter: ReturnType<typeof useTransfersFilters>["updateFilter"];
  searchMode: "realtime" | "manual";
  handleManualSearch: () => void;
}

const TransferFiltersComponent: React.FC<TransferFiltersProps> = ({
  filters,
  updateFilter,
  // searchMode,
  // handleManualSearch,
}) => {
  const [dateError, setDateError] = useState<string | null>(null);

  const {
    data: transferResponsiblesData,
    isLoading: isTransferResponsiblesLoading,
  } = useTransferResponsibles();

  // Función auxiliar para formatear fecha de manera segura
  const formatDateSafe = (date: Date): string => {
    try {
      return format(date, "yyyy-MM-dd");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const handleFechaInicioChange = (date: Date | undefined) => {
    setDateError(null); // Limpiar errores anteriores

    if (date) {
      // Validar que la fecha inicio no sea posterior a fecha fin
      if (filters.fecha_fin && date > filters.fecha_fin) {
        setDateError(
          "La fecha de inicio no puede ser posterior a la fecha de fin"
        );
        return;
      }
    }

    updateFilter("fecha_inicio", date ? formatDateSafe(date) : undefined);
  };

  const handleFechaFinChange = (date: Date | undefined) => {
    setDateError(null); // Limpiar errores anteriores

    if (date) {
      // Validar que la fecha fin no sea anterior a fecha inicio
      if (filters.fecha_inicio && date < filters.fecha_inicio) {
        setDateError(
          "La fecha de fin no puede ser anterior a la fecha de inicio"
        );
        return;
      }

      // Validar que la fecha no sea futura (opcional, según tu caso de uso)
      // const today = new Date();
      // today.setHours(0, 0, 0, 0);
      // if (date > today) {
      //     setDateError('No se pueden seleccionar fechas futuras');
      //     return;
      // }
    }

    updateFilter("fecha_fin", date ? formatDateSafe(date) : undefined);
  };

  // // Función para limpiar ambas fechas
  // const clearAllDateFilters = () => {
  //     setDateError(null);
  //     updateFilter('fecha_inicio', undefined);
  //     updateFilter('fecha_fin', undefined);
  // };

  return (
    <section className="space-y-2">
      <ProtectedAction
        permission={PERMISSIONS.TRA.LIST}
        roles={["Super Admin", "Administrador", "Vendedor"]}
        fallback={<div className="text-sm text-destructive">No tienes permisos para buscar.</div>}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="space-y-2">
            <Label>Nro. de transferencia</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 w-4 h-4" />
              <Input
                type="number"
                placeholder="Ej: 2054"
                value={filters.codigo_interno ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "codigo_interno",
                    e.target.value ? parseInt(e.target.value, 10) : undefined
                  )
                }
                className="pl-10 font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Responsable</Label>
            <ComboboxSelect
              value={filters.responsable}
              onChange={(value) =>
                updateFilter(
                  "responsable",
                  value && typeof value === "string"
                    ? parseInt(value, 10)
                    : undefined
                )
              }
              options={transferResponsiblesData?.data || []}
              optionTag={"nombre"}
              isLoadingData={isTransferResponsiblesLoading}
              enableAllOption={false}
              clearOnEmpty={true}
            />
          </div>
          <div className="space-y-2">
            <Label>Código OEM</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 w-4 h-4" />
              <Input
                placeholder="11122-10040-D..."
                value={filters.codigo_oem_producto}
                onChange={(e) =>
                  updateFilter("codigo_oem_producto", e.target.value)
                }
                className="pl-10 font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-2 w-full">
            <Label>Desde</Label>
            <div className="flex gap-2">
              <PopoverDatePicker
                value={filters.fecha_inicio}
                onChange={(date) => handleFechaInicioChange(date)}
                hasError={dateError}
                disabled={(date) => {
                  // Deshabilitar fechas futuras
                  // const today = new Date();
                  // today.setHours(0, 0, 0, 0);

                  const fechaFin = filters.fecha_fin
                    ? new Date(filters.fecha_fin)
                    : undefined;
                  if (fechaFin && date > fechaFin) return true;
                  return false;
                }}
              />
            </div>
          </div>

          {/* Fecha Fin */}
          <div className="space-y-2 w-full">
            <Label>Hasta</Label>
            <div className="flex gap-2">
              <PopoverDatePicker
                value={filters.fecha_fin}
                onChange={(date) => handleFechaFinChange(date)}
                hasError={dateError}
                disabled={(date) => {
                  // Deshabilitar fechas futuras
                  // const today = new Date();
                  // today.setHours(0, 0, 0, 0);
                  // if (date > today) return true;

                  const fechaInicio = filters.fecha_inicio
                    ? new Date(filters.fecha_inicio)
                    : undefined;
                  // Deshabilitar fechas anteriores a la fecha de inicio
                  if (fechaInicio && date < fechaInicio) return true;

                  return false;
                }}
              />
            </div>
          </div>

          {/* Botones de dirección al final */}
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label className="invisible">Filtros</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={
                  filters.direccion === "entrantes" ? "default" : "outline"
                }
                onClick={() =>
                  updateFilter(
                    "direccion",
                    filters.direccion === "entrantes" ? undefined : "entrantes"
                  )
                }
                className="gap-2 flex-1"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Entrantes
              </Button>
              <Button
                type="button"
                size="sm"
                variant={
                  filters.direccion === "salientes" ? "default" : "outline"
                }
                onClick={() =>
                  updateFilter(
                    "direccion",
                    filters.direccion === "salientes" ? undefined : "salientes"
                  )
                }
                className="gap-2 flex-1"
              >
                <ArrowUpFromLine className="h-4 w-4" />
                Salientes
              </Button>
            </div>
          </div>
        </div>

        {/* Botones de acción adicionales */}
        {/* <div className="flex gap-2 items-end justify-end flex-wrap">
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
            </div> */}

        {/* Mostrar error de validación */}
        {dateError && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{dateError}</span>
          </div>
        )}
      </ProtectedAction>
    </section>
  );
};

export default TransferFiltersComponent;
