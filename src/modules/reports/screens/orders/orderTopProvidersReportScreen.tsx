import { useState } from "react";
import { Users, Loader2 } from "lucide-react";
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
import { useOrderReportFilters } from "../../hooks/orders/useOrderReportFilters";
import { useOrderTopProvidersReport } from "../../hooks/orders/useOrderTopProvidersReport";
import { OrderReportFiltersPanel } from "../../components/orders/orderReportFiltersPanel";
import { OrderTopProveedoresReportTable } from "../../components/orders/orderTopProvidersReportTable";
import { OrderTopProveedoresChart } from "../../components/charts/orders/orderTopProvidersChart";

const OrderTopProveedoresReportScreen = () => {
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const { filters, topProveedoresFilters, updateFilter, applyFilters } =
    useOrderReportFilters(selectedBranchId ? Number(selectedBranchId) : null);

  const [appliedFilters, setAppliedFilters] = useState(topProveedoresFilters);

  const activeFilters =
    searchMode === "realtime" ? topProveedoresFilters : appliedFilters;

  const { data, isLoading, isFetching, isError, refetch } =
    useOrderTopProvidersReport({
      filters: activeFilters,
      enabled: !!activeFilters.fecha_inicio,
    });

  const rows = data?.data ?? [];

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <ProtectedAction
        permission="order-report_top_proveedores"
        roles={["Super Admin", "Administrador"]}
      >
        {/* Header */}
        <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 p-2">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                  Top Proveedores
                </h1>
                <p className="text-sm text-muted-foreground">
                  Proveedores más recurridos por cantidad de apariciones en
                  pedidos.
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
                setAppliedFilters({ ...topProveedoresFilters });
              }
            }}
            isFetching={isFetching}
            showTopN={true}
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
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                      <Users className="size-3 shrink-0" />
                      <span className="font-medium">
                        Top {rows.length} proveedores
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {(isFetching || isLoading) && (
                    <div className="flex items-center justify-center font-medium gap-2 h-8 px-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando datos...
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="min-h-0 flex-1 p-0">
              {viewMode === "table" ? (
                <OrderTopProveedoresReportTable
                  data={rows}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  isError={isError}
                />
              ) : (
                <div className="h-full p-3">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      Top {rows.length} — Apariciones vs Monto Total por
                      Proveedor
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Las barras muestran las apariciones; la línea muestra el
                      monto total invertido
                    </p>
                  </div>
                  <div className="h-[calc(100%-40px)]">
                    <OrderTopProveedoresChart data={rows} height="100%" />
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

export default OrderTopProveedoresReportScreen;
