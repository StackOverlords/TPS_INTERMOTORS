import { useState, useMemo } from "react";
import {
  BarChart3,
  List,
  Loader2,
  Package,
  TrendingUp,
  ArrowLeftRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { Button } from "@/components/atoms/button";
import { Slider } from "@/components/atoms/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/tabs";
import { ViewToggle } from "../../components/ViewToggle";
import type { ViewMode } from "../../types/report.types";
import { useBranchStore } from "@/states/branchStore";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";
import { useKardexReportFilters } from "../../hooks/products/useKardexReportFilters";
import {
  useDownloadKardexReport,
  useKardexReport,
} from "../../hooks/products/useKardexReport";
import { KardexReportTable } from "../../components/products/kardexReportTable";
import { KardexReportFiltersPanel } from "../../components/products/kardexReportFiltersPanel";
import { KardexSaldoChart } from "../../components/charts/kardexSaldoChart";
import { KardexEntradasSalidasChart } from "../../components/charts/KardexEntradasSalidasChart";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";

const CHART_LIMIT = 100;

const KardexReportScreen = () => {
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeChart, setActiveChart] = useState<"saldo" | "movimientos">(
    "saldo"
  );
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [selectedProductInfo, setSelectedProductInfo] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    applyFilters,
    chartVisualLimit,
    setChartVisualLimit,
  } = useKardexReportFilters(Number(selectedBranchId));

  const activeFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  const { data, isLoading, isFetching, isError, refetch } = useKardexReport({
    filters: activeFilters,
    enabled: !!activeFilters.producto,
  });

  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadKardexReport();

  const handleExport = () => {
    downloadReport(activeFilters);
  };

  const handleManualSearch = () => {
    if (searchMode === "manual") {
      applyFilters();
    }
  };

  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));
  };

  const effectiveChartLimit = useMemo(() => {
    return Math.min(chartVisualLimit, CHART_LIMIT, data?.data.length || 0);
  }, [chartVisualLimit, data?.data.length]);

  const hasLimit = (data?.data.length || 0) > CHART_LIMIT;
  const hasProductSelected = !!filters.producto && filters.producto > 0;

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <ProtectedAction
        permission={PERMISSIONS.INV.REPORT_KARDEX}
        roles={["Super Admin", "Administrador", "Vendedor"]}
      >
        {/* Header */}
        <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 dark:bg-purple-400/10 p-2">
                <List className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                  Kardex de Producto
                </h1>
                <p className="text-sm text-muted-foreground">
                  Reporte detallado de movimientos de inventario por producto.
                </p>
              </div>
            </div>
            {hasProductSelected && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-base text-purple-700 dark:text-purple-300">
                <Package className="size-4 shrink-0" />
                <span className="font-medium truncate">
                  {selectedProductInfo
                    ? `#${selectedProductInfo.id} — ${selectedProductInfo.nombre}`
                    : `ID: ${filters.producto}`}
                </span>
              </div>
            )}
          </div>

          <KardexReportFiltersPanel
            filters={filters}
            onFiltersChange={(key, value) => updateFilter(key, value)}
            onRefresh={() => refetch()}
            onExport={handleExport}
            loading={isFetching || isDownloading}
            searchMode={searchMode}
            onSearchModeToggle={toggleSearchMode}
            onSearch={handleManualSearch}
            isDownloading={isDownloading}
            isFetching={isFetching}
            setSelectedProductInfo={setSelectedProductInfo}
          />
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader className="flex flex-col flex-shrink-0 items-center p-2 border-border border-b">
              <CardTitle className="text-base flex flex-row justify-between items-center gap-2 w-full">
                <div className="flex items-center gap-2">
                  <ViewToggle value={viewMode} onChange={setViewMode} />
                  {hasProductSelected && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300">
                      <span className="font-medium truncate">
                        {selectedProductInfo
                          ? `${selectedProductInfo.nombre}`
                          : `ID: ${filters.producto}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {(isFetching || isLoading) && (
                    <div className="flex items-center justify-center font-medium gap-2 h-8 px-4 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando datos... Este proceso puede tardar.
                    </div>
                  )}
                  {data?.data && data.data.length > 0 && (
                    <span>
                      Mostrando {data.data.length} registro
                      {data.data.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </CardTitle>

              {viewMode === "chart" && data?.data && data.data.length > 0 && (
                <div className="w-full">
                  <Card className="border-dashed border-primary/30 bg-primary/5">
                    <CardContent className="py-2 px-3 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-semibold">
                            Visualización de registros
                          </Label>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <Slider
                            value={[chartVisualLimit]}
                            onValueChange={(value) =>
                              setChartVisualLimit(value[0])
                            }
                            min={10}
                            max={
                              data.data.length < CHART_LIMIT
                                ? data.data.length
                                : CHART_LIMIT
                            }
                            step={1}
                            className="flex-1"
                          />
                          <EditableQuantity
                            value={effectiveChartLimit}
                            className="h-8 w-16 text-xs text-center font-semibold"
                            onSubmit={(value) => {
                              const num = Math.min(
                                value as number,
                                CHART_LIMIT
                              );
                              setChartVisualLimit(num);
                            }}
                            validate={(val) => {
                              const num = parseInt(val);
                              return (
                                !isNaN(num) && num > 0 && num <= CHART_LIMIT
                              );
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {hasLimit ? (
                          <>
                            El gráfico muestra hasta{" "}
                            <strong className="text-foreground">
                              {CHART_LIMIT} registros
                            </strong>{" "}
                            para una mejor lectura.{" "}
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-primary underline font-medium text-xs"
                              onClick={() => setViewMode("table")}
                            >
                              Ver todos en la tabla
                            </Button>
                            .
                          </>
                        ) : (
                          <>Todos los registros se muestran en el gráfico.</>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardHeader>

            <CardContent className="min-h-0 flex-1 p-0">
              {viewMode === "table" ? (
                <KardexReportTable
                  data={data?.data || []}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  isError={isError}
                  showRowNumbers={true}
                  rows={data?.data.length}
                />
              ) : (
                <Tabs
                  value={activeChart}
                  onValueChange={(v) =>
                    setActiveChart(v as "saldo" | "movimientos")
                  }
                  className="flex flex-col h-full min-h-0"
                >
                  {/* Header de tabs: título a la izquierda, tabs a la derecha */}
                  <div className="flex-shrink-0 px-3 pt-2 pb-2 border-b border-border flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {activeChart === "saldo"
                          ? "Evolución del Saldo"
                          : "Entradas vs Salidas"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                        {activeChart === "saldo"
                          ? "Variación del stock disponible a lo largo del tiempo"
                          : "Comparativa de movimientos de entrada y salida en Bs"}
                      </p>
                    </div>
                    <TabsList className="h-8 flex-shrink-0">
                      <TabsTrigger
                        value="saldo"
                        className="gap-1.5 text-xs h-6"
                      >
                        <TrendingUp className="size-3" />
                        Saldo
                      </TabsTrigger>
                      <TabsTrigger
                        value="movimientos"
                        className="gap-1.5 text-xs h-6"
                      >
                        <ArrowLeftRight className="size-3" />
                        Movimientos
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Cada tab ocupa todo el espacio restante */}
                  <TabsContent
                    value="saldo"
                    className="flex-1 min-h-0 mt-0 pt-2 px-2 pb-2 data-[state=inactive]:hidden"
                  >
                    <KardexSaldoChart
                      data={data?.data || []}
                      height="100%"
                      limit={effectiveChartLimit}
                    />
                  </TabsContent>

                  <TabsContent
                    value="movimientos"
                    className="flex-1 min-h-0 mt-0 pt-2 px-2 pb-2 data-[state=inactive]:hidden"
                  >
                    <KardexEntradasSalidasChart
                      data={data?.data || []}
                      height="100%"
                      limit={effectiveChartLimit}
                    />
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

export default KardexReportScreen;
