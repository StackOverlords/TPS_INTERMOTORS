import { useState } from "react";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import TooltipButton from "@/components/common/TooltipButton";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useBranchStore } from "@/states/branchStore";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpRight,
  CalendarCheck,
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  Search,
  TrendingUp,
} from "lucide-react";
import { useQuotationReportConversion } from "../../hooks/queries/reports/useQuotationReportConversion";
import type {
  QuotationReportConversionItem,
  QuotationReportConversionFilters,
} from "../../types/quotationReports.types";
import { ViewToggle } from "@/modules/reports/components/ViewToggle";
import type { ViewMode } from "@/modules/reports/types/report.types";
import {
  BaseAreaChart,
  type BaseAreaData,
} from "@/components/charts/BaseAreaChart";
import { cn } from "@/lib/utils";

const getTodayString = () => new Date().toISOString().split("T")[0];

const getTasaVariant = (tasa: number) => {
  if (tasa >= 60) return "success" as const;
  if (tasa >= 30) return "warning" as const;
  return "danger" as const;
};

const columns: ColumnDef<QuotationReportConversionItem>[] = [
  {
    id: "rowNumber",
    header: "Nro",
    size: 50,
    minSize: 40,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="text-center text-xs font-semibold text-muted-foreground">
        {row.index + 1}
      </div>
    ),
  },
  {
    accessorKey: "mes",
    header: "Mes",
    size: 130,
    minSize: 100,
    cell: ({ getValue }) => (
      <div className="font-medium">{getValue<string>()}</div>
    ),
  },
  {
    accessorKey: "total_cotizaciones",
    header: "Total Cotizaciones",
    size: 160,
    minSize: 120,
    cell: ({ getValue }) => (
      <div className="text-center font-semibold text-primary">
        {getValue<number>().toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "cotizaciones_convertidas",
    header: "Convertidas",
    size: 130,
    minSize: 100,
    cell: ({ getValue }) => (
      <div className="text-center font-medium text-emerald-600 dark:text-emerald-400">
        {getValue<number>().toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "tasa_conversion",
    header: "Tasa Conversión",
    size: 150,
    minSize: 120,
    cell: ({ getValue }) => {
      const tasa = getValue<number>();
      return (
        <div className="text-center">
          <Badge variant={getTasaVariant(tasa)} className="rounded font-bold">
            {tasa.toLocaleString("es-BO", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            %
          </Badge>
        </div>
      );
    },
  },
];

const QuotationReportConversionScreen = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState(getTodayString());
  const [shouldFetch, setShouldFetch] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const filters: QuotationReportConversionFilters = {
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin || undefined,
    sucursal: Number(selectedBranchId) || null,
  };

  const {
    data: reportData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuotationReportConversion({
    filters,
    enabled: shouldFetch && !!fechaInicio,
  });

  const data = reportData?.data ?? [];

  const { table } = useCustomTable({
    data,
    columns,
    enableColumnResizing: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    columnResizeMode: "onChange",
    persistenceKey: "quotation-report-conversion-table",
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);
    setFechaInicio(pastDate.toISOString().split("T")[0]);
    setFechaFin(today.toISOString().split("T")[0]);
  };

  const handleSearch = () => {
    if (!fechaInicio) return;
    if (!shouldFetch) {
      setShouldFetch(true);
    } else {
      refetch();
    }
  };

  // KPI calculations
  const totalCotizaciones = data.reduce(
    (sum, item) => sum + item.total_cotizaciones,
    0
  );
  const totalConvertidas = data.reduce(
    (sum, item) => sum + item.cotizaciones_convertidas,
    0
  );
  const tasaPromedio =
    data.length > 0
      ? data.reduce((sum, item) => sum + item.tasa_conversion, 0) / data.length
      : 0;
  const mesMayorConversion = data.reduce(
    (best, item) =>
      item.tasa_conversion > (best?.tasa_conversion ?? -1) ? item : best,
    null as QuotationReportConversionItem | null
  );

  // Area chart data: eje X = mes, eje Y = tasa_conversion
  const chartData: BaseAreaData[] = data.map((item) => ({
    name: item.mes,
    value: item.tasa_conversion,
  }));

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      {/* Header */}
      <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 p-2">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                Reporte de Conversión
              </h1>
              <p className="text-sm text-muted-foreground">
                Tasa de conversión de cotizaciones por mes
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <section className="border-t border-border pt-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="fecha-inicio" className="text-sm whitespace-nowrap">
                Fecha inicio:
              </Label>
              <Input
                id="fecha-inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="h-8 w-36"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="fecha-fin" className="text-sm whitespace-nowrap">
                Fecha fin:
              </Label>
              <Input
                id="fecha-fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="h-8 w-36"
              />
            </div>

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

            <Button
              variant="default"
              onClick={handleSearch}
              disabled={isFetching || !fechaInicio}
            >
              {isFetching ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Search className="size-4 mr-2" />
              )}
              {isFetching ? "Buscando..." : "Buscar"}
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <TooltipButton
                onClick={() => refetch()}
                buttonProps={{
                  variant: "outline",
                  size: "sm",
                  disabled: isFetching || !shouldFetch,
                }}
                tooltip="Actualizar reporte"
              >
                <RefreshCcw
                  className={cn("size-4", isFetching && "animate-spin")}
                />
              </TooltipButton>
            </div>
          </div>
        </section>
      </header>

      {/* Error */}
      {isError && error && (
        <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 rounded-lg p-3 text-destructive text-sm flex-shrink-0">
          <strong>Error:</strong>{" "}
          {(error as Error)?.message ||
            "No se pudo cargar el reporte. Verifica que el endpoint esté disponible."}
        </div>
      )}

      {/* KPI Cards — solo visibles cuando hay datos */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-shrink-0">
          <div className="bg-background border border-border rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <FileSpreadsheet className="size-3.5" />
              Total cotizaciones
            </div>
            <div className="text-2xl font-bold text-primary">
              {totalCotizaciones.toLocaleString()}
            </div>
          </div>

          <div className="bg-background border border-border rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <ArrowUpRight className="size-3.5 text-emerald-500" />
              Total convertidas
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalConvertidas.toLocaleString()}
            </div>
          </div>

          <div className="bg-background border border-border rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <TrendingUp className="size-3.5 text-blue-500" />
              Tasa promedio
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {tasaPromedio.toLocaleString("es-BO", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              %
            </div>
          </div>

          <div className="bg-background border border-border rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <CalendarCheck className="size-3.5 text-amber-500" />
              Mejor mes
            </div>
            <div className="text-base font-bold text-amber-600 dark:text-amber-400 truncate">
              {mesMayorConversion
                ? `${mesMayorConversion.mes} (${mesMayorConversion.tasa_conversion.toLocaleString("es-BO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)`
                : "-"}
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 min-h-0">
        <div
          className={cn(
            "bg-background rounded-lg border border-border flex flex-col",
            viewMode === "chart" ? "h-auto" : "h-full"
          )}
        >
          {/* Toolbar interno */}
          <div className="flex flex-col flex-shrink-0 p-2 gap-2 border-b border-border">
            <div className="flex items-center justify-between flex-shrink-0">
              <ViewToggle value={viewMode} onChange={setViewMode} />

              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
                  <FileSpreadsheet className="size-4 text-primary" />
                  <span className="font-semibold text-primary">
                    {data.length}
                  </span>
                  <span className="text-primary hidden sm:inline">
                    meses
                  </span>
                </div>

                {(isFetching || isLoading) && (
                  <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando datos... Este proceso puede tardar.
                  </div>
                )}
              </div>
            </div>

            {viewMode === "table" && (
              <div className="flex-shrink-0">
                <span className="text-sm text-muted-foreground">
                  {!shouldFetch
                    ? "Seleccioná una fecha de inicio y presioná 'Buscar'"
                    : data.length > 0
                      ? `Mostrando ${data.length} meses`
                      : "Sin resultados para el período seleccionado"}
                </span>
              </div>
            )}
          </div>

          {viewMode === "chart" ? (
            <div className="p-4" style={{ height: 420 }}>
              <BaseAreaChart
                data={chartData}
                colorConfig={{
                  type: "gradient",
                  strokeColor: "#10b981",
                  gradientStart: "#10b981",
                  gradientEnd: "#d1fae5",
                  gradientStartOpacity: 0.5,
                  gradientEndOpacity: 0.02,
                }}
                seriesLabel="Tasa de conversión (%)"
                height={380}
                showLegend
                showDots
                yAxisTickFormatter={(v) =>
                  `${v.toLocaleString("es-BO", { maximumFractionDigits: 1 })}%`
                }
                isLoading={isLoading}
                isError={isError}
                refetch={refetch}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <VirtualizedCustomizableTable
                table={table}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                errorMessage="Error al cargar el reporte de conversión"
                noDataMessage="Seleccioná una fecha de inicio y presioná 'Buscar' para cargar el reporte."
                rows={20}
                enableColumnReordering
                enableSorting
                estimatedRowHeight={50}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default QuotationReportConversionScreen;
