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
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  Search,
  Users,
} from "lucide-react";
import { useQuotationReportDesempeno } from "../../hooks/queries/reports/useQuotationReportDesempeno";
import type {
  QuotationReportDesempenoItem,
  QuotationReportDesempenoFilters,
} from "../../types/quotationReports.types";
import { ViewToggle } from "@/modules/reports/components/ViewToggle";
import type { ViewMode } from "@/modules/reports/types/report.types";
import { BaseBarChart } from "@/components/charts/BaseBarChart";
import { cn } from "@/lib/utils";

const getTodayString = () => new Date().toISOString().split("T")[0];

const getTasaVariant = (tasa: number) => {
  if (tasa >= 60) return "success" as const;
  if (tasa >= 30) return "warning" as const;
  return "danger" as const;
};

const columns: ColumnDef<QuotationReportDesempenoItem>[] = [
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
    accessorKey: "responsable",
    header: "Responsable",
    size: 200,
    minSize: 140,
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
    accessorKey: "convertidas",
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
  {
    accessorKey: "monto_promedio_cotizacion",
    header: "Monto Promedio",
    size: 150,
    minSize: 120,
    cell: ({ getValue }) => (
      <div className="text-right font-medium">
        {getValue<number>().toLocaleString("es-BO", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    ),
  },
];

const DesempenoTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-background/75 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-3 text-xs min-w-56">
      <p className="font-semibold text-foreground mb-2">{d.name}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total cotizaciones:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{d.total_cotizaciones?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Convertidas:</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">{d.convertidas?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Tasa conversión:</span>
          <span className="font-medium tabular-nums">{d.tasa_conversion?.toLocaleString("es-BO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Monto promedio:</span>
          <span className="font-medium tabular-nums">{d.monto_promedio_cotizacion?.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
};

const QuotationReportDesempenoScreen = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState(getTodayString());
  const [shouldFetch, setShouldFetch] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const filters: QuotationReportDesempenoFilters = {
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
  } = useQuotationReportDesempeno({
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
    persistenceKey: "quotation-report-desempeno-table",
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

  const chartData = data.map((item) => ({
    name: item.responsable,
    total_cotizaciones: item.total_cotizaciones,
    convertidas: item.convertidas,
    tasa_conversion: item.tasa_conversion,
    monto_promedio_cotizacion: item.monto_promedio_cotizacion,
  }));

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      {/* Header */}
      <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 p-2">
              <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                Desempeño de Vendedores
              </h1>
              <p className="text-sm text-muted-foreground">
                Métricas de conversión y volumen por responsable
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
                    vendedores
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
                      ? `Mostrando ${data.length} vendedores`
                      : "Sin resultados para el período seleccionado"}
                </span>
              </div>
            )}
          </div>

          {viewMode === "chart" ? (
            <div className="p-4" style={{ height: 420 }}>
              <BaseBarChart
                data={chartData}
                customTooltip={DesempenoTooltip}
                series={[
                  {
                    dataKey: "total_cotizaciones",
                    name: "Total Cotizaciones",
                    colorConfig: {
                      type: "gradient",
                      gradientFrom: "#6366f1",
                      gradientTo: "#a5b4fc",
                    },
                    radius: [3, 3, 0, 0],
                  },
                  {
                    dataKey: "convertidas",
                    name: "Convertidas",
                    colorConfig: {
                      type: "gradient",
                      gradientFrom: "#10b981",
                      gradientTo: "#6ee7b7",
                    },
                    radius: [3, 3, 0, 0],
                  },
                ]}
                nameKey="name"
                height={380}
                showLegend
                xAxisAngle={-35}
                xAxisHeight={60}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <VirtualizedCustomizableTable
                table={table}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                errorMessage="Error al cargar el reporte de desempeño de vendedores"
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

export default QuotationReportDesempenoScreen;
