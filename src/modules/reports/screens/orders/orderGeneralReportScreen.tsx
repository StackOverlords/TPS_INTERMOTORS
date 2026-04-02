import { useState } from "react";
import { ClipboardList, Loader2, BarChart3, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/tabs";
import { ViewToggle } from "../../components/ViewToggle";
import type { ViewMode } from "../../types/report.types";
import { useBranchStore } from "@/states/branchStore";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { useOrderReportFilters } from "../../hooks/orders/useOrderReportFilters";
import { useOrderGeneralReport } from "../../hooks/orders/useOrderGeneralReport";
import { useDownloadOrderGeneralReport } from "../../hooks/orders/useOrderGeneralReport";
import { OrderReportFiltersPanel } from "../../components/orders/orderReportFiltersPanel";
import { OrderGeneralReportTable } from "../../components/orders/orderGeneralReportTable";
import { OrderGeneralByProviderChart } from "../../components/charts/orders/orderGeneralByProviderChart";
import { OrderGeneralByMonthChart } from "../../components/charts/orders/orderGeneralByMonthChart";

type ChartMode = "provider" | "month";

const OrderGeneralReportScreen = () => {
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeChart, setActiveChart] = useState<ChartMode>("provider");

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const {
    filters,
    generalFilters,
    appliedGeneralFilters,
    updateFilter,
    applyFilters,
  } = useOrderReportFilters(selectedBranchId ? Number(selectedBranchId) : null);

  const activeFilters =
    searchMode === "realtime" ? generalFilters : appliedGeneralFilters;

  const { data, isLoading, isFetching, isError, refetch } =
    useOrderGeneralReport({
      filters: activeFilters,
      enabled: !!activeFilters.fecha_inicio,
    });

  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadOrderGeneralReport();

  const rows = data?.data ?? [];

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <ProtectedAction
        permission="order-report_general"
        roles={["Super Admin", "Administrador"]}
      >
        {/* Header */}
        <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-500/10 dark:bg-violet-400/10 p-2">
                <ClipboardList className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                  Reporte General de Pedidos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Detalle de pedidos a proveedores — producto, costo, cantidad y
                  estado.
                </p>
              </div>
            </div>
          </div>

          <OrderReportFiltersPanel
            filters={filters}
            onFiltersChange={(key, value) => updateFilter(key, value)}
            onRefresh={() => refetch()}
            onExport={() => downloadReport(activeFilters)}
            loading={isFetching || isDownloading}
            searchMode={searchMode}
            onSearchModeToggle={() =>
              setSearchMode((p) => (p === "realtime" ? "manual" : "realtime"))
            }
            onSearch={() => searchMode === "manual" && applyFilters()}
            isDownloading={isDownloading}
            isFetching={isFetching}
            showTopN={false}
            showExport={true}
          />
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader className="flex flex-col flex-shrink-0 items-center p-2 border-border border-b">
              <CardTitle className="text-base flex flex-row justify-between items-center gap-2 w-full">
                <ViewToggle value={viewMode} onChange={setViewMode} />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {(isFetching || isLoading) && (
                    <div className="flex items-center justify-center font-medium gap-2 h-8 px-4 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 rounded-lg text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando datos...
                    </div>
                  )}
                  {rows.length > 0 && (
                    <span>
                      {rows.length} registro{rows.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="min-h-0 flex-1 p-0">
              {viewMode === "table" ? (
                <OrderGeneralReportTable
                  data={rows}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  isError={isError}
                  showRowNumbers={true}
                />
              ) : (
                <Tabs
                  value={activeChart}
                  onValueChange={(v) => setActiveChart(v as ChartMode)}
                  className="flex flex-col h-full min-h-0"
                >
                  <div className="flex-shrink-0 px-3 pt-2 pb-2 border-b border-border flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {activeChart === "provider"
                          ? "Inversión por Proveedor"
                          : "Evolución Mensual de Pedidos"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                        {activeChart === "provider"
                          ? "Subtotal total invertido agrupado por proveedor"
                          : "Total de inversión en pedidos por mes"}
                      </p>
                    </div>
                    <TabsList className="h-8 flex-shrink-0">
                      <TabsTrigger
                        value="provider"
                        className="gap-1.5 text-xs h-6"
                      >
                        <BarChart3 className="size-3" />
                        Por Proveedor
                      </TabsTrigger>
                      <TabsTrigger
                        value="month"
                        className="gap-1.5 text-xs h-6"
                      >
                        <TrendingUp className="size-3" />
                        Por Mes
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="provider"
                    className="flex-1 min-h-0 mt-0 pt-2 px-2 pb-2 data-[state=inactive]:hidden"
                  >
                    <OrderGeneralByProviderChart data={rows} height="100%" />
                  </TabsContent>

                  <TabsContent
                    value="month"
                    className="flex-1 min-h-0 mt-0 pt-2 px-2 pb-2 data-[state=inactive]:hidden"
                  >
                    <OrderGeneralByMonthChart data={rows} height="100%" />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </ProtectedAction>
    </main>
  );
};

export default OrderGeneralReportScreen;
