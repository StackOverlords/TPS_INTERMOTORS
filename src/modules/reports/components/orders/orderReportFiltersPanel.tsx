import { useState, useRef } from "react";
import { Label } from "@/components/atoms/label";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import {
  AlertCircle,
  Download,
  Loader2,
  RefreshCcw,
  Search,
  X,
  Zap,
} from "lucide-react";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import authSDK from "@/services/sdk-simple-auth";
import type { OrderReportFiltersState } from "../../hooks/orders/useOrderReportFilters";

interface OrderReportFiltersPanelProps {
  filters: OrderReportFiltersState;
  onFiltersChange: <K extends keyof OrderReportFiltersState>(
    key: K,
    value: OrderReportFiltersState[K]
  ) => void;
  onRefresh: () => void;
  onExport?: () => void;
  loading?: boolean;
  searchMode?: "realtime" | "manual";
  onSearchModeToggle?: () => void;
  onSearch?: () => void;
  isFetching?: boolean;
  isDownloading?: boolean;
  /** Mostrar campo top_n (para reporte Top Proveedores) */
  showTopN?: boolean;
  /** Mostrar botón exportar */
  showExport?: boolean;
}

export function OrderReportFiltersPanel({
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
  showTopN = false,
  showExport = false,
}: OrderReportFiltersPanelProps) {
  const [dateError, setDateError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const branches = authSDK.getCurrentUser()?.sucursales || [];

  useFormEnterNavigation({ containerRef, submitOnLastField: false });

  const handleFechaInicioChange = (date: Date | undefined) => {
    setDateError(null);
    if (date && filters.fecha_fin) {
      if (date > new Date(filters.fecha_fin)) {
        setDateError("La fecha inicio no puede ser posterior a la fecha fin");
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
      if (date < new Date(filters.fecha_inicio)) {
        setDateError("La fecha fin no puede ser anterior a la fecha inicio");
        return;
      }
    }
    onFiltersChange(
      "fecha_fin",
      date ? date.toISOString().split("T")[0] : undefined
    );
  };

  const clearDates = () => {
    setDateError(null);
    onFiltersChange("fecha_inicio", "");
    onFiltersChange("fecha_fin", undefined);
  };

  const setQuickRange = (days: number) => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(today.getDate() - days);
    setDateError(null);
    onFiltersChange("fecha_inicio", past.toISOString().split("T")[0]);
    onFiltersChange("fecha_fin", today.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={`grid grid-cols-1 gap-2 ${showTopN ? "md:grid-cols-4" : "md:grid-cols-3"}`}
      >
        {/* Fecha Inicio */}
        <div className="space-y-1.5">
          <Label>Desde</Label>
          <PopoverDatePicker
            value={
              filters.fecha_inicio ? new Date(filters.fecha_inicio) : undefined
            }
            onChange={handleFechaInicioChange}
            hasError={dateError}
            disabled={(date) => {
              const fin = filters.fecha_fin
                ? new Date(filters.fecha_fin)
                : undefined;
              return fin ? date > fin : false;
            }}
          />
        </div>

        {/* Fecha Fin */}
        <div className="space-y-1.5">
          <Label>Hasta</Label>
          <PopoverDatePicker
            value={filters.fecha_fin ? new Date(filters.fecha_fin) : undefined}
            onChange={handleFechaFinChange}
            hasError={dateError}
            disabled={(date) => {
              const ini = filters.fecha_inicio
                ? new Date(filters.fecha_inicio)
                : undefined;
              return ini ? date < ini : false;
            }}
          />
        </div>

        {/* Sucursal */}
        <div className="space-y-1.5">
          <Label>Sucursal</Label>
          <ComboboxSelect
            value={filters.sucursal?.toString() || "all"}
            onChange={(value) => {
              onFiltersChange(
                "sucursal",
                value === "all" ? null : parseInt(value as string, 10)
              );
            }}
            options={branches}
            enableAllOption={true}
            optionTag="sucursal"
            allowClear={false}
          />
        </div>

        {/* Top N (opcional) */}
        {showTopN && (
          <div className="space-y-1.5">
            <Label>Top N proveedores</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={filters.top_n}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  onFiltersChange("top_n", val);
                }
              }}
              className="h-9"
            />
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickRange(30)}
            className="text-xs"
          >
            Último mes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickRange(90)}
            className="text-xs"
          >
            Últimos 3 meses
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickRange(180)}
            className="text-xs"
          >
            Últimos 6 meses
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2">
          {(filters.fecha_inicio || filters.fecha_fin) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearDates}
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

          {showExport && onExport && (
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
          )}

          {onSearchModeToggle && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onSearchModeToggle}
              className="text-xs"
            >
              <Zap
                className={`h-3 w-3 mr-1 ${searchMode === "realtime" ? "text-yellow-500" : "text-gray-500"}`}
              />
              {searchMode === "realtime" ? "Tiempo real" : "Manual"}
            </Button>
          )}

          {searchMode === "manual" && onSearch && (
            <Button onClick={onSearch} disabled={isFetching || isDownloading}>
              {isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {isFetching ? "Consultando..." : "Consultar"}
            </Button>
          )}
        </div>
      </div>

      {dateError && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{dateError}</span>
        </div>
      )}
    </div>
  );
}
