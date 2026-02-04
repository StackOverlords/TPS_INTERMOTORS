import { Label } from "@/components/atoms/label";
import { Button } from "@/components/atoms/button";
import {
  AlertCircle,
  Download,
  Loader2,
  RefreshCcw,
  Search,
  X,
  Zap,
} from "lucide-react";
import { useState, useRef } from "react";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import type { ReportGeneralFilters } from "../types/report.types";
import authSDK from "@/services/sdk-simple-auth";

interface GeneralReportFiltersPanelProps {
  filters: ReportGeneralFilters;
  onFiltersChange: <K extends keyof ReportGeneralFilters>(
    key: K,
    value: ReportGeneralFilters[K]
  ) => void;
  onRefresh: () => void;
  onExport: () => void;
  loading?: boolean;
  searchMode?: "realtime" | "manual";
  onSearchModeToggle?: () => void;
  onSearch?: () => void;
  isFetching?: boolean;
  isDownloading?: boolean;
}

export function GeneralReportFiltersPanel({
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  loading = false,
  searchMode = "manual",
  onSearchModeToggle,
  onSearch,
  isFetching = false,
  isDownloading = false,
}: GeneralReportFiltersPanelProps) {
  const [dateError, setDateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const branches = authSDK.getCurrentUser()?.sucursales || [];

  useFormEnterNavigation({
    containerRef: containerRef,
    submitOnLastField: false,
  });

  const handleFechaInicioChange = (date: Date | undefined) => {
    setDateError(null);

    if (date && filters.fecha_fin) {
      const fechaFin = new Date(filters.fecha_fin);
      if (date > fechaFin) {
        setDateError(
          "La fecha de inicio no puede ser posterior a la fecha de fin"
        );
        return;
      }
    }

    onFiltersChange(
      "fecha_inicio",
      date ? date.toISOString().split("T")[0] : ""
    );
  };

  const handleFechaFinChange = (date: Date | undefined) => {
    setDateError(null);

    if (date && filters.fecha_inicio) {
      const fechaInicio = new Date(filters.fecha_inicio);
      if (date < fechaInicio) {
        setDateError(
          "La fecha de fin no puede ser anterior a la fecha de inicio"
        );
        return;
      }
    }

    onFiltersChange(
      "fecha_fin",
      date ? date.toISOString().split("T")[0] : undefined
    );
  };

  const clearAllDateFilters = () => {
    setDateError(null);
    onFiltersChange("fecha_inicio", "");
    onFiltersChange("fecha_fin", undefined);
  };

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);

    setDateError(null);
    onFiltersChange("fecha_inicio", pastDate.toISOString().split("T")[0]);
    onFiltersChange("fecha_fin", today.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Fecha Inicio */}
        <div className="space-y-2 w-full">
          <Label>Desde *</Label>
          <PopoverDatePicker
            value={
              filters.fecha_inicio ? new Date(filters.fecha_inicio) : undefined
            }
            onChange={handleFechaInicioChange}
            hasError={dateError}
            disabled={(date) => {
              const fechaFin = filters.fecha_fin
                ? new Date(filters.fecha_fin)
                : undefined;
              if (fechaFin && date > fechaFin) return true;
              return false;
            }}
          />
        </div>

        {/* Fecha Fin */}
        <div className="space-y-2 w-full">
          <Label>Hasta</Label>
          <PopoverDatePicker
            value={filters.fecha_fin ? new Date(filters.fecha_fin) : undefined}
            onChange={handleFechaFinChange}
            hasError={dateError}
            disabled={(date) => {
              const fechaInicio = filters.fecha_inicio
                ? new Date(filters.fecha_inicio)
                : undefined;
              if (fechaInicio && date < fechaInicio) return true;
              return false;
            }}
          />
        </div>

        {/* Sucursal */}
        <div className="space-y-2">
          <Label>Sucursal</Label>
          <ComboboxSelect
            value={filters.sucursal?.toString() || "all"}
            onChange={(value) => {
              const numValue =
                value === "all" ? null : parseInt(value as string, 10);
              onFiltersChange("sucursal", numValue);
            }}
            options={branches}
            enableAllOption={true}
            optionTag="sucursal"
            allowClear={false}
          />
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
        {/* Atajos de fecha */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickDateRange(7)}
            className="text-xs"
          >
            Última semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickDateRange(30)}
            className="text-xs"
          >
            Último mes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickDateRange(90)}
            className="text-xs"
          >
            Últimos 3 meses
          </Button>
        </div>

        <div className="flex-1" />

        {/* Acciones principales */}
        <div className="flex gap-2">
          {(filters.fecha_inicio || filters.fecha_fin) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllDateFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar fechas
            </Button>
          )}

          <Button
            onClick={onRefresh}
            size="sm"
            variant="outline"
            disabled={loading}
          >
            <RefreshCcw
              className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Recargar
          </Button>

          <Button
            onClick={onExport}
            size="sm"
            variant="outline"
            disabled={loading || isDownloading}
          >
            <Download
              className={`size-4 mr-2 ${isDownloading ? "animate-pulse" : ""}`}
            />
            {isDownloading ? "Descargando..." : "Exportar"}
          </Button>

          {onSearchModeToggle && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onSearchModeToggle}
              className="text-xs"
            >
              <Zap
                className={`h-3 w-3 mr-1 ${
                  searchMode === "realtime"
                    ? "text-yellow-500"
                    : "text-gray-500"
                }`}
              />
              {searchMode === "realtime" ? "Tiempo real" : "Manual"}
            </Button>
          )}

          {searchMode === "manual" && onSearch && (
            <Button onClick={onSearch} disabled={isFetching}>
              {isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {isFetching ? "Buscando..." : "Buscar"}
            </Button>
          )}
        </div>
      </div>

      {/* Error de validación */}
      {dateError && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{dateError}</span>
        </div>
      )}
    </div>
  );
}
