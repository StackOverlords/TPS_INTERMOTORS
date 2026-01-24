import { useState } from "react";
import { Loader2, SquareKanban, type LucideIcon } from "lucide-react";
import type { ViewMode } from "../types/report.types";
import { ViewToggle } from "../components/ViewToggle";
import { Skeleton } from "@/components/atoms/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { HorizontalBarChart } from "../components/charts/HorizontalBarChart";
import { Alert, AlertDescription } from "@/components/atoms/alert";
import type { ReportItem } from "../types/report.types";
import { SaleReportFiltersPanel } from "./saleReportFiltersPanel";
import { SaleReportTable } from "./saleReportTable";

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
  error?: Error | null;

  // Filtros
  filters: any;
  onFiltersChange: (key: string, value: any) => void;
  onRefresh: () => void;
  onExport: () => void;
  showRanking?: boolean;
  searchMode?: "realtime" | "manual";
  onSearchModeToggle?: () => void;
  onSearch?: () => void;

  // Estados de carga
  isDownloading?: boolean;

  // Configuración del gráfico
  chartDataKey?: "cantidad" | "total";
  chartColor?: string;
  chartTitle?: string;
  tableTitle?: string;

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
  error,
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  showRanking = false,
  searchMode = "manual",
  onSearchModeToggle,
  onSearch,
  isDownloading = false,
  chartDataKey = "cantidad",
  chartColor = "#3b82f6",
  chartTitle = "Ranking Visual",
  tableTitle = "Detalle del Ranking",
  highlightTotalColumn = false,
  reportType,
}: SalesReportWrapperProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const chartHeight = Math.max(400, (filters.ranking || 10) * 40);

  return (
    <div className="h-full p-4 gap-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className={`rounded-lg ${iconBgColor} p-2`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0">
        <SaleReportFiltersPanel
          filters={filters}
          onFiltersChange={onFiltersChange}
          onRefresh={onRefresh}
          onExport={onExport}
          showRanking={showRanking}
          loading={isFetching || isDownloading}
          searchMode={searchMode}
          onSearchModeToggle={onSearchModeToggle}
          onSearch={onSearch}
        />
      </div>

      {/* View Toggle y resumen */}
      <div className="flex items-center justify-between flex-shrink-0">
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {data.length > 0 && (
            <>
              <span>
                Mostrando{" "}
                {showRanking
                  ? `top ${Math.min(filters.ranking || 10, data.length)}`
                  : data.length}{" "}
                productos
              </span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">
                Total:{" "}
                {data
                  .reduce(
                    (sum, item) => sum + parseFloat(item.cantidad.toString()),
                    0
                  )
                  .toLocaleString("es-BO", { maximumFractionDigits: 0 })}{" "}
                unidades
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Error al cargar el reporte:{" "}
              {error?.message || "Error desconocido"}
            </AlertDescription>
          </Alert>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                Sin datos disponibles
              </h3>
              <p className="text-muted-foreground text-sm">
                No se encontraron productos en el período seleccionado
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Indicador de carga mientras refetch */}
            {isFetching && (
              <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Actualizando datos...
              </div>
            )}

            {/* Chart View */}
            {(viewMode === "chart" || viewMode === "both") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    {chartTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HorizontalBarChart
                    data={data}
                    dataKey={chartDataKey}
                    color={chartColor}
                    height={
                      viewMode === "both"
                        ? Math.min(chartHeight, 500)
                        : chartHeight
                    }
                    showGradient
                    limit={filters.ranking || data.length}
                  />
                </CardContent>
              </Card>
            )}

            {/* Table View */}
            {(viewMode === "table" || viewMode === "both") && (
              <Card className="flex flex-col h-full">
                <CardHeader className="flex flex-shrink-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <SquareKanban className="size-6" />
                    {tableTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 overflow-hidden">
                  <SaleReportTable
                    data={data}
                    showRanking={showRanking}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    highlightTotalColumn={highlightTotalColumn}
                    reportType={reportType}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
