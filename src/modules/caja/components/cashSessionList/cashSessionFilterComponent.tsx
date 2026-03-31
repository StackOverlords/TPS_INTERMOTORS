import { Label } from "@/components/atoms/label";
import { Search } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { format } from "date-fns";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import type { CashSessionFilters } from "../../types/cashFilters.types";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

interface CashSessionFilterComponentProps {
  filters: CashSessionFilters;
  onFiltersChange: (f: Partial<CashSessionFilters>) => void;
  onSearch: () => void;
}

const STATUS_OPTIONS = [
  { id: "", label: "Todas" },
  { id: "ABIERTA", label: "Abierta" },
  { id: "CERRADA", label: "Cerrada" },
];

const formatDateSafe = (date: Date): string => {
  try {
    return format(date, "yyyy-MM-dd");
  } catch {
    return "";
  }
};

export const CashSessionFilterComponent: React.FC<CashSessionFilterComponentProps> = ({
  filters,
  onFiltersChange,
  onSearch,
}) => {
  const [dateError, setDateError] = useState<string | null>(null);

  const handleFechaInicioChange = (date: Date | undefined) => {
    setDateError(null);

    if (date && filters.fecha_fin) {
      const fechaFin = new Date(filters.fecha_fin);
      if (date > fechaFin) {
        setDateError("La fecha de inicio no puede ser posterior a la fecha de fin");
        return;
      }
    }

    onFiltersChange({ fecha_inicio: date ? formatDateSafe(date) : undefined });
  };

  const handleFechaFinChange = (date: Date | undefined) => {
    setDateError(null);

    if (date && filters.fecha_inicio) {
      const fechaInicio = new Date(filters.fecha_inicio);
      if (date < fechaInicio) {
        setDateError("La fecha de fin no puede ser anterior a la fecha de inicio");
        return;
      }
    }

    onFiltersChange({ fecha_fin: date ? formatDateSafe(date) : undefined });
  };

  const handleEstadoChange = (value: string | number | undefined) => {
    const strValue = typeof value === "string" ? value : undefined;
    onFiltersChange({ estado: strValue as CashSessionFilters["estado"] || undefined });
  };

  return (
    <section className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Fecha Inicio */}
        <div className="space-y-2 w-full">
          <Label>Fecha Inicio</Label>
          <PopoverDatePicker
            value={filters.fecha_inicio}
            onChange={handleFechaInicioChange}
            hasError={dateError}
            disabled={(date) => {
              const fechaFin = filters.fecha_fin ? new Date(filters.fecha_fin) : undefined;
              if (fechaFin && date > fechaFin) return true;
              return false;
            }}
          />
        </div>

        {/* Fecha Fin */}
        <div className="space-y-2 w-full">
          <Label>Fecha Fin</Label>
          <PopoverDatePicker
            value={filters.fecha_fin}
            onChange={handleFechaFinChange}
            hasError={dateError}
            disabled={(date) => {
              const fechaInicio = filters.fecha_inicio ? new Date(filters.fecha_inicio) : undefined;
              if (fechaInicio && date < fechaInicio) return true;
              return false;
            }}
          />
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label>Estado</Label>
          <ComboboxSelect
            value={filters.estado ?? ""}
            onChange={handleEstadoChange}
            options={STATUS_OPTIONS}
            enableAllOption={false}
            optionTag="label"
            allowClear={false}
          />
        </div>

        {/* Buscar */}
        <div className="h-full flex items-end">
          <Button onClick={onSearch} className="w-full">
            <Search className="size-4" />
            Buscar
          </Button>
        </div>
      </div>

      {dateError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{dateError}</span>
        </div>
      )}
    </section>
  );
};

export default CashSessionFilterComponent;
