import { useMemo, useState } from "react";
import { Loader2, BarChart3, type LucideIcon } from "lucide-react";
import type { ViewMode } from "../types/report.types";
import { ViewToggle } from "../components/ViewToggle";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { Button } from "@/components/atoms/button";
import { Slider } from "@/components/atoms/slider";
import type { ReportItem } from "../types/report.types";
import { SaleReportFiltersPanel } from "./saleReportFiltersPanel";
import { SaleReportTable } from "./saleReportTable";
import { SaleHorizontalBarChart } from "./charts/saleHorizontalBarChart";
import type { ColorConfig } from "@/components/charts/Basehorizontalbarchart";
import type { themeColorPresets } from "@/hooks/charts/useChatThemeColors";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";

interface SalesReportWrapperProps {
  // Título y descripción
  title: string;
  description: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;

  // Datos
  data: ReportItem[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;

  // Filtros
  filters: any;
  onFiltersChange: (key: string, value: any) => void;
  onRefresh: () => void;
  onExport: () => void;
  searchMode?: "realtime" | "manual";
  onSearchModeToggle?: () => void;
  onSearch?: () => void;

  // Control de visualización del gráfico (NUEVO)
  chartVisualLimit: number;
  onChartVisualLimitChange: (limit: number) => void;

  // Estados de carga
  isDownloading?: boolean;

  // Configuración del gráfico
  chartDataKey?: "cantidad" | "total";
  chartTitle?: string;
  tableTitle?: string;
  colorPreset?: keyof typeof themeColorPresets;
  customColorConfig?: ColorConfig;

  // Props adicionales
  highlightTotalColumn?: boolean;
  reportType?: "XIngreso" | "XCantidad";
}

export function SalesReportWrapper({
  title,
  description,
  icon: Icon,
  iconBgColor = "bg-blue-500/10",
  iconColor = "text-blue-500",
  data,
  isLoading,
  isFetching,
  isError,
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  searchMode = "manual",
  onSearchModeToggle,
  onSearch,
  chartVisualLimit,
  onChartVisualLimitChange,
  isDownloading = false,
  chartDataKey = "cantidad",
  chartTitle = "Ranking Visual",
  tableTitle = "Detalle del Ranking",
  highlightTotalColumn = false,
  reportType,
  colorPreset,
  customColorConfig,
}: SalesReportWrapperProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Calcular límite efectivo (no más de 100)
  const effectiveChartLimit = useMemo(() => {
    return Math.min(chartVisualLimit, 100, data.length);
  }, [chartVisualLimit, data.length]);

  const CHART_LIMIT = 100;
  const hasLimit = data.length > CHART_LIMIT;

  return (
    <div className="h-full p-2 gap-2 flex flex-col">
      {/* Header */}
      <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg ${iconBgColor} p-2`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <SaleReportFiltersPanel
          filters={filters}
          onFiltersChange={onFiltersChange}
          onRefresh={onRefresh}
          onExport={onExport}
          loading={isFetching || isDownloading}
          searchMode={searchMode}
          onSearchModeToggle={onSearchModeToggle}
          onSearch={onSearch}
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
                    {viewMode === "table" ? tableTitle : chartTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {/* Indicador de carga mientras refetch */}
                  {(isFetching || isLoading) && (
                    <div className="flex items-center justify-center font-medium gap-2 h-8 px-4 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando datos... Este proceso puede tardar.
                    </div>
                  )}
                  {data.length > 0 && (
                    <>
                      <span>
                        Mostrando{" "}
                        {`${Math.min(filters.ranking || 10, data.length)} `}
                        productos
                      </span>
                    </>
                  )}
                </div>
              </CardTitle>
              {viewMode === "chart" && (
                <div className="w-full">
                  {data.length > 0 && (
                    <Card className="border-dashed border-primary/30 bg-primary/5">
                      <CardContent className="py-2 px-3 space-y-1">
                        {/* Header */}
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
                                onChartVisualLimitChange(value[0])
                              }
                              min={5}
                              max={
                                data.length < CHART_LIMIT
                                  ? data.length
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
                                onChartVisualLimitChange(num);
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

                        {/* Descripción */}
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
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="min-h-0 flex-1 p-0">
              {viewMode === "table" ? (
                <SaleReportTable
                  data={data}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  highlightTotalColumn={highlightTotalColumn}
                  reportType={reportType}
                  isError={isError}
                />
              ) : (
                <div className="h-full pt-2">
                  <SaleHorizontalBarChart
                    data={data}
                    dataKey={chartDataKey}
                    limit={effectiveChartLimit}
                    colorPreset={colorPreset}
                    customColorConfig={customColorConfig}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
