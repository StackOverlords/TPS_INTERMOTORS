import { useState } from "react";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import { format } from "date-fns";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import TooltipButton from "@/components/common/TooltipButton";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useBranchStore } from "@/states/branchStore";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";
import {
  useQuotationReportGeneral,
  useDownloadQuotationReportGeneral,
} from "../../hooks/queries/reports/useQuotationReportGeneral";
import type {
  QuotationReportGeneralItem,
  QuotationReportGeneralFilters,
} from "../../types/quotationReports.types";
import { ViewToggle } from "@/modules/reports/components/ViewToggle";
import type { ViewMode } from "@/modules/reports/types/report.types";
import {
  BaseComposedChart,
  type BaseComposedData,
} from "@/components/charts/BaseComposedChart";
import { cn } from "@/lib/utils";

const getTodayString = () => new Date().toISOString().split("T")[0];

const columns: ColumnDef<QuotationReportGeneralItem>[] = [
  {
    id: "rowNumber",
    header: "Nro",
    size: 40,
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
    accessorKey: "nro_cotizacion",
    header: "Nro Cotización",
    size: 130,
    minSize: 100,
    cell: ({ getValue }) => (
      <div className="font-mono font-medium text-primary">
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
    size: 110,
    minSize: 90,
    cell: ({ getValue }) => (
      <div className="text-sm text-muted-foreground">{getValue<string>()}</div>
    ),
  },
  {
    accessorKey: "cliente_nombre",
    header: "Cliente",
    size: 200,
    minSize: 130,
    cell: ({ getValue }) => (
      <div className="font-medium">{getValue<string>()}</div>
    ),
  },
  {
    accessorKey: "forma_quo",
    header: "Forma",
    size: 110,
    minSize: 80,
    cell: ({ getValue }) => (
      <div className="text-sm">{getValue<string>()}</div>
    ),
  },
  {
    accessorKey: "codigo_producto",
    header: "Código",
    size: 80,
    minSize: 60,
    cell: ({ getValue }) => (
      <div className="font-mono text-xs">{getValue<string>()}</div>
    ),
  },
  {
    accessorKey: "producto",
    header: "Producto",
    size: 240,
    minSize: 140,
    cell: ({ getValue }) => (
      <div className="text-sm">{getValue<string>()}</div>
    ),
  },
  {
    accessorKey: "cantidad",
    header: "Cantidad",
    size: 90,
    minSize: 70,
    cell: ({ getValue }) => (
      <div className="text-center font-medium">
        {getValue<number>().toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "precio",
    header: "Precio",
    size: 100,
    minSize: 80,
    cell: ({ getValue }) => (
      <div className="text-right font-medium">
        {getValue<number>().toLocaleString("es-BO", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    ),
  },
  {
    accessorKey: "descuento",
    header: "Descuento",
    size: 100,
    minSize: 80,
    cell: ({ getValue }) => {
      const desc = getValue<number | null | undefined>();
      return (
        <div className="text-center">
          {desc && desc > 0 ? (
            <Badge variant="warning" className="rounded font-bold">
              {desc.toLocaleString("es-BO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "subtotal",
    header: "Subtotal",
    size: 110,
    minSize: 80,
    cell: ({ getValue }) => {
      const val = getValue<number | null | undefined>() ?? 0;
      return (
        <div className="text-right font-semibold text-primary">
          {val.toLocaleString("es-BO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "convertida",
    header: "Convertida",
    size: 100,
    minSize: 80,
    cell: ({ getValue }) => {
      const convertida = getValue<boolean>();
      return (
        <div className="text-center">
          <Badge variant={convertida ? "success" : "secondary"} className="rounded">
            {convertida ? "Sí" : "No"}
          </Badge>
        </div>
      );
    },
  },
];

const GeneralTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-48">
      <p className="font-semibold text-foreground mb-2">{d.name}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Cantidad:</span>
          <span className="font-medium tabular-nums">{d.barValue?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium tabular-nums text-purple-600 dark:text-purple-400">
            {d.lineValue?.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

const QuotationReportGeneralScreen = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState(getTodayString());
  const [shouldFetch, setShouldFetch] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const filters: QuotationReportGeneralFilters = {
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
  } = useQuotationReportGeneral({
    filters,
    enabled: shouldFetch && !!fechaInicio,
  });

  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadQuotationReportGeneral();

  const data = reportData?.data ?? [];

  const { table } = useCustomTable({
    data,
    columns,
    enableColumnResizing: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    columnResizeMode: "onChange",
    persistenceKey: "quotation-report-general-table",
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

  const handleDownload = () => {
    if (!fechaInicio) return;
    downloadReport(filters);
  };

  // Preparar datos para el gráfico: agrupar por fecha_quo (bar=cantidad, line=subtotal)
  const chartData: BaseComposedData[] = (() => {
    const grouped = new Map<string, { barValue: number; lineValue: number }>();
    for (const item of data) {
      const key = item.fecha?.split(" ")[0] ?? "Sin fecha";
      const existing = grouped.get(key) ?? { barValue: 0, lineValue: 0 };
      grouped.set(key, {
        barValue: existing.barValue + (item.cantidad ?? 0),
        lineValue: existing.lineValue + (item.subtotal ?? 0),
      });
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, values]) => ({ name, ...values }));
  })();

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      {/* Header */}
      <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 dark:bg-purple-400/10 p-2">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                Reporte General de Cotizaciones
              </h1>
              <p className="text-sm text-muted-foreground">
                Detalle completo de cotizaciones por período
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
              <PopoverDatePicker
                value={fechaInicio}
                onChange={(date) => setFechaInicio(date ? format(date, "yyyy-MM-dd") : "")}
                className="h-8 w-36"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="fecha-fin" className="text-sm whitespace-nowrap">
                Fecha fin:
              </Label>
              <PopoverDatePicker
                value={fechaFin}
                onChange={(date) => setFechaFin(date ? format(date, "yyyy-MM-dd") : "")}
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

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!fechaInicio || isDownloading}
              >
                <Download
                  className={cn(
                    "size-4 mr-2",
                    isDownloading && "animate-pulse"
                  )}
                />
                {isDownloading ? "Descargando..." : "Exportar Excel"}
              </Button>
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
                    registros
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
                      ? `Mostrando ${data.length} registros`
                      : "Sin resultados para el período seleccionado"}
                </span>
              </div>
            )}
          </div>

          {viewMode === "chart" ? (
            <div className="p-4" style={{ height: 420 }}>
              <BaseComposedChart
                data={chartData}
                colorConfig={{
                  type: "gradient",
                  barGradientStart: "#9333ea",
                  barGradientEnd: "#d8b4fe",
                  lineColor: "#f59e0b",
                }}
                customTooltip={GeneralTooltip}
                barLabel="Cantidad"
                lineLabel="Subtotal"
                height={380}
                limit={chartData.length}
                barValueFormatter={(v) => v.toLocaleString()}
                lineValueFormatter={(v) =>
                  v.toLocaleString("es-BO", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <VirtualizedCustomizableTable
                table={table}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                errorMessage="Error al cargar el reporte general de cotizaciones"
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

export default QuotationReportGeneralScreen;
