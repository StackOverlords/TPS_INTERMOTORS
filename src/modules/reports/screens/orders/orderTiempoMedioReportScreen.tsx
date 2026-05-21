import { useState } from "react";
import { Timer, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { ViewToggle } from "../../components/ViewToggle";
import type { ViewMode } from "../../types/report.types";
import { useBranchStore } from "@/states/branchStore";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";
import { useOrderReportFilters } from "../../hooks/orders/useOrderReportFilters";
import { useOrderAverageTimeReport } from "../../hooks/orders/useOrderAverageTimeReport";
import { OrderReportFiltersPanel } from "../../components/orders/orderReportFiltersPanel";
import { OrderTiempoMedioReportTable } from "../../components/orders/orderTiempoMedioReportTable";
import { OrderTiempoMedioChart } from "../../components/charts/orders/orderTiempoMedioChart";

const OrderTiempoMedioReportScreen = () => {
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const { filters, tiempoMedioFilters, updateFilter, applyFilters } =
    useOrderReportFilters(selectedBranchId ? Number(selectedBranchId) : null);

  const [appliedFilters, setAppliedFilters] = useState(tiempoMedioFilters);

  const activeFilters =
    searchMode === "realtime" ? tiempoMedioFilters : appliedFilters;

  const { data, isLoading, isFetching, isError, refetch } =
    useOrderAverageTimeReport({
      filters: activeFilters,
      enabled: !!activeFilters.fecha_inicio,
    });

  const rows = data?.data ?? [];

  // Cálculo del promedio global para el badge
  const avgGlobal =
    rows.length > 0
      ? rows.reduce(
          (sum, item) => sum + parseFloat(item.dias_promedio.toString()),
          0
        ) / rows.length
      : 0;

  const getAvgColor = (days: number) => {
    if (days <= 15)
      return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300";
    if (days <= 60)
      return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300";
    return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
  };

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <ProtectedAction
        permission={PERMISSIONS.PED.REPORT_TIEMPO_MEDIO}
        roles={["Super Admin", "Administrador"]}
      >
        {/* Header */}
        <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 dark:bg-orange-400/10 p2">
                <Timer className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                  Tiempo Medio de Entrega
                </h1>
                <p className="text-sm text-muted-foreground">
                  Días promedio entre fecha de pedido y llegada, por proveedor.
                </p>
              </div>
            </div>
          </div>

          <OrderReportFiltersPanel
            filters={filters}
            onFiltersChange={(key, value) => updateFilter(key, value)}
            onRefresh={() => refetch()}
            loading={isFetching}
            searchMode={searchMode}
            onSearchModeToggle={() =>
              setSearchMode((p) => (p === "realtime" ? "manual" : "realtime"))
            }
            onSearch={() => {
              if (searchMode === "manual") {
                applyFilters();
                setAppliedFilters({ ...tiempoMedioFilters });
              }
            }}
            isFetching={isFetching}
            showTopN={false}
            showExport={false}
          />
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader className="flex flex-col flex-shrink-0 items-center p-2 border-border border-b">
              <CardTitle className="text-base flex flex-row justify-between items-center gap-2 w-full">
                <div className="flex items-center gap-2">
                  <ViewToggle value={viewMode} onChange={setViewMode} />
                  {rows.length > 0 && (
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs ${getAvgColor(avgGlobal)}`}
                    >
                      <Timer className="size-3 shrink-0" />
                      <span className="font-medium">
                        Promedio global: {Math.round(avgGlobal)} días
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {(isFetching || isLoading) && (
                    <div className="flex items-center justify-center font-medium gap-2 h-8 px-4 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando datos...
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="min-h-0 flex-1 p-0">
              {viewMode === "table" ? (
                <OrderTiempoMedioReportTable
                  data={rows}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  isError={isError}
                />
              ) : (
                <div className="h-full p-3">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      Tiempo Promedio de Entrega por Proveedor
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Verde ≤ 15 días · Ámbar ≤ 60 días · Rojo &gt; 60 días —
                      ordenado de menor a mayor
                    </p>
                  </div>
                  <div className="h-[calc(100%-40px)]">
                    <OrderTiempoMedioChart data={rows} height="100%" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ProtectedAction>
    </main>
  );
};

export default OrderTiempoMedioReportScreen;
