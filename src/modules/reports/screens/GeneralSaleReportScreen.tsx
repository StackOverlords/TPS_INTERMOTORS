import { useState, useMemo } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { Button } from "@/components/atoms/button";
import { Slider } from "@/components/atoms/slider";
import { ViewToggle } from "../components/ViewToggle";
import type { ViewMode } from "../types/report.types";
import { GeneralReportFiltersPanel } from "../components/GeneralReportFiltersPanel";
import { SaleReportTable } from "../components/saleReportTable";
import {
  useReportGeneral,
  useDownloadReportGeneral,
} from "../hooks/useReportGeneral";
import { useBranchStore } from "@/states/branchStore";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";
import { useGeneralSaleReportFilters } from "../hooks/useGeneralSaleReportFilters";
import { SalesComposedChart } from "../components/charts/SalesComposedChart";

const CHART_LIMIT = 100;

const GeneralReportScreen = () => {
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    applyFilters,
    chartVisualLimit,
    setChartVisualLimit,
  } = useGeneralSaleReportFilters(Number(selectedBranchId));

  const activeFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  const { data, isLoading, isFetching, isError, refetch } = useReportGeneral({
    filters: activeFilters,
    enabled: !!activeFilters.fecha_inicio,
  });

  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadReportGeneral();

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

  return (
    <div className="h-full p-2 gap-2 flex flex-col">
      {/* Header */}
      <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 dark:bg-purple-400/10 p-2">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                Reporte General de Ventas
              </h1>
              <p className="text-sm text-muted-foreground">
                Análisis de precio vs volumen de ventas
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <GeneralReportFiltersPanel
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
        />
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="h-full">
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader className="flex flex-col flex-shrink-0 items-center p-2 border-border border-b">
              <CardTitle className="text-base flex flex-row justify-between items-center gap-2 w-full">
                <div className="flex items-center">
                  <ViewToggle value={viewMode} onChange={setViewMode} />
                  <span className="text-sm font-medium text-muted-foreground sr-only">
                    {viewMode === "table"
                      ? "Detalle de Productos"
                      : "Análisis Visual"}
                  </span>
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
                      Mostrando {data.data.length} producto
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
                            Visualización de productos
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
                              {CHART_LIMIT} productos
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
                          <>Todos los productos se muestran en el gráfico.</>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardHeader>

            <CardContent className="min-h-0 flex-1 p-0">
              {viewMode === "table" ? (
                <SaleReportTable
                  data={data?.data || []}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  isError={isError}
                  showRanking={false}
                  highlightTotalColumn={true}
                  highlightQuantityColumn={true}
                  showRowNumbers={true}
                  rows={data?.data.length}
                />
              ) : (
                <div className="h-full pt-2 px-2">
                  <SalesComposedChart
                    data={data?.data || []}
                    limit={effectiveChartLimit}
                    colorPreset="purple"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GeneralReportScreen;
