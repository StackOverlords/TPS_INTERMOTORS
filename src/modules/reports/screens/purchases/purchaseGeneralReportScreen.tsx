import { useState } from "react";
import { ShoppingCart, Loader2, BarChart3, ScatterChart } from "lucide-react";
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
import { PERMISSIONS } from "@/lib/permissions";
import { usePurchaseReportFilters } from "../../hooks/purchases/usePurchaseReportFilters";
import { useReportPurchaseGeneral } from "../../hooks/purchases/useReportPurchaseGeneral";
import { useDownloadReportPurchaseGeneral } from "../../hooks/purchases/useReportPurchaseGeneral";
import { PurchaseReportFiltersPanel } from "../../components/purchases/purchaseReportFiltersPanel";
import { PurchaseGeneralReportTable } from "../../components/purchases/purchaseGeneralReportTable";
import { PurchaseGeneralByGroupChart } from "../../components/charts/purchases/purchaseGeneralByGroupChart";
import { PurchaseGeneralScatterChart } from "../../components/charts/purchases/purchaseGeneralScatterChart";

type ChartMode = "group" | "scatter";

const PurchaseGeneralReportScreen = () => {
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeChart, setActiveChart] = useState<ChartMode>("group");

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const {
    filters,
    generalFilters,
    appliedGeneralFilters,
    updateFilter,
    applyFilters,
  } = usePurchaseReportFilters(
    selectedBranchId ? Number(selectedBranchId) : null
  );

  const activeFilters =
    searchMode === "realtime" ? generalFilters : appliedGeneralFilters;

  const { data, isLoading, isFetching, isError, refetch } =
    useReportPurchaseGeneral({
      filters: activeFilters,
      enabled: !!activeFilters.fecha_inicio,
    });

  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadReportPurchaseGeneral();

  const rows = data?.data ?? [];

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <ProtectedAction
        permission={PERMISSIONS.COM.REPORT_GENERAL}
        roles={["Super Admin", "Administrador", "Vendedor"]}
      >
        {/* Header */}
        <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 dark:bg-blue-400/10 p-2">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                  Reporte General de Compras
                </h1>
                <p className="text-sm text-muted-foreground">
                  Compras agrupadas por producto — cantidad, costo medio y
                  subtotal.
                </p>
              </div>
            </div>
          </div>

          <PurchaseReportFiltersPanel
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
            showRanking={false}
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
                    <div className="flex items-center justify-center font-medium gap-2 h-8 px-4 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando datos...
                    </div>
                  )}
                  {rows.length > 0 && (
                    <span>
                      {rows.length} producto{rows.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="min-h-0 flex-1 p-0">
              {viewMode === "table" ? (
                <PurchaseGeneralReportTable
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
                        {activeChart === "group"
                          ? "Inversión por Grupo de Producto"
                          : "Dispersión: Costo Medio vs Cantidad"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                        {activeChart === "group"
                          ? "Subtotal total comprado agrupado por categoría de producto"
                          : "Relación entre el costo unitario y la cantidad comprada por producto"}
                      </p>
                    </div>
                    <TabsList className="h-8 flex-shrink-0">
                      <TabsTrigger
                        value="group"
                        className="gap-1.5 text-xs h-6"
                      >
                        <BarChart3 className="size-3" />
                        Por Grupo
                      </TabsTrigger>
                      <TabsTrigger
                        value="scatter"
                        className="gap-1.5 text-xs h-6"
                      >
                        <ScatterChart className="size-3" />
                        Dispersión
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="group"
                    className="flex-1 min-h-0 mt-0 pt-2 px-2 pb-2 data-[state=inactive]:hidden"
                  >
                    <PurchaseGeneralByGroupChart data={rows} height="100%" />
                  </TabsContent>

                  <TabsContent
                    value="scatter"
                    className="flex-1 min-h-0 mt-0 pt-2 px-2 pb-2 data-[state=inactive]:hidden"
                  >
                    <PurchaseGeneralScatterChart data={rows} height="100%" />
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

export default PurchaseGeneralReportScreen;
