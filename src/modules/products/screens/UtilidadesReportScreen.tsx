import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
import { Slider } from "@/components/atoms/slider";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import TooltipButton from "@/components/common/TooltipButton";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useBranchStore } from "@/states/branchStore";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Download,
  DollarSign,
  Loader2,
  RefreshCcw,
  Search,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useUtilidadesReport, useDownloadUtilidadesReport } from "../hooks/queries/useUtilidadesReport";
import type { UtilidadesFilters, UtilidadesItem, UtilidadesStats } from "../types/UtilidadesReport.types";
import { StockViewToggle, type StockViewMode } from "../components/StockViewToggle";
import { UtilidadesChart } from "../components/UtilidadesChart";
import { subMonths, subWeeks, subYears, startOfYear, format } from "date-fns";
import { EditableQuantity } from "@/modules/shoppingCart/components/editableQuantity";
import { cn } from "@/lib/utils";

const UtilidadesReportScreen = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  // Estados para los filtros en edición
  const [fechaInicio, setFechaInicio] = useState<string>(
    format(subMonths(new Date(), 1), "yyyy-MM-dd")
  );
  const [fechaFin, setFechaFin] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [shouldFetch, setShouldFetch] = useState(false);
  const [viewMode, setViewMode] = useState<StockViewMode>("table");
  const [topLimit, setTopLimit] = useState<number>(20); // Límite para el gráfico

  // Filtros aplicados (solo se actualizan al presionar "Buscar")
  const [appliedFilters, setAppliedFilters] = useState<UtilidadesFilters>({
    sucursal: selectedBranchId ? Number(selectedBranchId) : 0,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
  });

  // Query del reporte (usa filtros aplicados)
  const { data: reportData, isLoading, isFetching, isError, error, refetch } =
    useUtilidadesReport({
      filters: appliedFilters,
      enabled: shouldFetch,
    });

  // Mutation para descargar
  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadUtilidadesReport();

  const data = reportData?.data ?? [];

  // Calcular estadísticas
  const stats: UtilidadesStats = useMemo(() => {
    const totalVentas = data.reduce(
      (sum, item) => sum + parseFloat(item.ventas.toString()),
      0
    );
    const totalCosto = data.reduce(
      (sum, item) => sum + parseFloat(item.importe_costo.toString()),
      0
    );
    const totalIngreso = data.reduce(
      (sum, item) => sum + parseFloat(item.importe_venta.toString()),
      0
    );
    const totalUtilidad = data.reduce(
      (sum, item) => sum + parseFloat(item.utilidad.toString()),
      0
    );
    const margenPromedio = totalIngreso > 0 ? (totalUtilidad / totalIngreso) * 100 : 0;
    const productosRentables = data.filter(
      (item) => parseFloat(item.utilidad.toString()) > 0
    ).length;
    const productosNoRentables = data.filter(
      (item) => parseFloat(item.utilidad.toString()) <= 0
    ).length;

    return {
      totalItems: data.length,
      totalVentas,
      totalCosto,
      totalIngreso,
      totalUtilidad,
      margenPromedio,
      productosRentables,
      productosNoRentables,
    };
  }, [data]);

  // Columnas de la tabla
  const columns = useMemo<ColumnDef<UtilidadesItem>[]>(
    () => [
      {
        id: "rowNumber",
        header: "Nro",
        size: 60,
        minSize: 40,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="text-center text-xs font-semibold text-gray-500">
            {row.index + 1}
          </div>
        ),
      },
      {
        accessorKey: "codigo",
        header: "Código",
        size: 150,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="font-mono font-medium">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "producto",
        header: "Producto",
        size: 400,
        minSize: 200,
        cell: ({ getValue }) => (
          <div className="font-medium text-primary">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "ventas",
        header: "Unidades",
        size: 120,
        minSize: 80,
        cell: ({ getValue }) => {
          const ventas = parseFloat(getValue<string>());
          return (
            <div className="text-center font-semibold">
              {ventas.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
            </div>
          );
        },
      },
      {
        accessorKey: "importe_costo",
        header: "Costo Total",
        size: 140,
        minSize: 100,
        cell: ({ getValue }) => {
          const costo = parseFloat(getValue<string>());
          return (
            <div className="text-right">
              <span className="font-medium text-red-600">
                Bs. {costo.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "importe_venta",
        header: "Ingreso Total",
        size: 140,
        minSize: 100,
        cell: ({ getValue }) => {
          const ingreso = parseFloat(getValue<string>());
          return (
            <div className="text-right">
              <span className="font-medium text-blue-600">
                Bs. {ingreso.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "utilidad",
        header: "Utilidad",
        size: 140,
        minSize: 100,
        cell: ({ getValue, row }) => {
          const utilidad = parseFloat(getValue<string>());
          const ingreso = parseFloat(row.original.importe_venta.toString());
          const margen = ingreso > 0 ? (utilidad / ingreso) * 100 : 0;

          return (
            <div className="text-right">
              <Badge
                variant={utilidad > 0 ? "success" : utilidad < 0 ? "danger" : "secondary"}
                className="rounded font-bold"
              >
                {utilidad > 0 ? (
                  <TrendingUp className="size-3 mr-1" />
                ) : utilidad < 0 ? (
                  <TrendingDown className="size-3 mr-1" />
                ) : null}
                Bs. {utilidad.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                {margen.toFixed(1)}% margen
              </div>
            </div>
          );
        },
      },
    ],
    []
  );

  const { table } = useCustomTable({
    data,
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    columnResizeMode: "onChange",
    persistenceKey: "utilidades-report-table",
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleSearch = () => {
    // Aplicar los filtros actuales
    setAppliedFilters({
      sucursal: selectedBranchId ? Number(selectedBranchId) : 0,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (!shouldFetch) {
      setShouldFetch(true);
    } else {
      refetch();
    }
  };

  const handleDownload = () => {
    downloadReport(appliedFilters);
  };

  // Funciones para shortcuts de fechas
  const setDateRange = (startDate: Date, endDate: Date) => {
    setFechaInicio(format(startDate, "yyyy-MM-dd"));
    setFechaFin(format(endDate, "yyyy-MM-dd"));
  };

  const setLastWeek = () => {
    setDateRange(subWeeks(new Date(), 1), new Date());
  };

  const setLastMonth = () => {
    setDateRange(subMonths(new Date(), 1), new Date());
  };

  const setLast3Months = () => {
    setDateRange(subMonths(new Date(), 3), new Date());
  };

  const setThisYear = () => {
    setDateRange(startOfYear(new Date()), new Date());
  };

  const setLastYear = () => {
    const lastYear = subYears(new Date(), 1);
    setDateRange(startOfYear(lastYear), new Date(lastYear.getFullYear(), 11, 31));
  };

  return (
    <main className="h-full p-4 gap-4 flex flex-col">
      {/* Header Compacto */}
      <header className="flex items-center gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reporte de Utilidades
          </h1>
          <p className="text-muted-foreground">
            Análisis de rentabilidad por producto
          </p>
        </div>
      </header>

      {/* Filtros Compactos */}
      <section className="bg-background rounded-lg p-3 border border-border flex-shrink-0 space-y-3">
        {/* Fila 1: Shortcuts de fechas */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Rápido:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={setLastWeek}
            className="h-7 text-xs"
          >
            Última semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={setLastMonth}
            className="h-7 text-xs"
          >
            Último mes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={setLast3Months}
            className="h-7 text-xs"
          >
            Últimos 3 meses
          </Button>
          {/* <Button
            variant="outline"
            size="sm"
            onClick={setThisYear}
            className="h-7 text-xs"
          >
            Este año
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={setLastYear}
            className="h-7 text-xs"
          >
            Año pasado
          </Button> */}
        </div>

        {/* Fila 2: Controles principales */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label htmlFor="fecha-inicio" className="text-sm">
              Desde:
            </Label>
            <input
              id="fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="h-8 px-2 rounded-md border border-border text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="fecha-fin" className="text-sm">
              Hasta:
            </Label>
            <input
              id="fecha-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="h-8 px-2 rounded-md border border-border text-sm"
            />
          </div>

          <Button variant="default" onClick={handleSearch} disabled={isFetching}>
            {isFetching ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Search className="size-4 mr-2" />
            )}
            {isFetching ? "Buscando..." : "Buscar"}
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <TooltipButton
              onClick={handleRefresh}
              buttonProps={{
                variant: "outline",
                size: "sm",
                disabled: isFetching,
              }}
              tooltip="Actualizar reporte"
            >
              <RefreshCcw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </TooltipButton>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={data.length === 0 || isDownloading}
            >
              <Download className={`size-4 mr-2 ${isDownloading ? "animate-pulse" : ""}`} />
              {isDownloading ? "Descargando..." : "Exportar"}
            </Button>
          </div>
        </div>
      </section>

      {/* ViewToggle y Stats integrados */}
      <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
        <StockViewToggle value={viewMode} onChange={setViewMode} />

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
              <DollarSign className="size-4 text-primary" />
              <span className="font-semibold text-primary">{stats.totalItems}</span>
            </div>
            <span className="text-muted-foreground hidden sm:inline">productos</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10">
            <TrendingUp className="size-4 text-green-600" />
            <span className="font-semibold text-green-600">
              Bs. {stats.totalUtilidad.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-green-600/70 text-xs">utilidad</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10">
            <span className="text-blue-600 text-xs">📊</span>
            <span className="font-semibold text-blue-600">{stats.margenPromedio.toFixed(1)}%</span>
            <span className="text-blue-600/70 text-xs">margen</span>
          </div>
        </div>
      </div>

      {/* Selector de Top (solo visible en modo gráfico) */}
      {viewMode === "chart" && data.length > 0 && (
        <div className="bg-background rounded-lg p-3 border border-border flex-shrink-0">
          <div className="flex items-center gap-4">
            <Label className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
              <span>Top {topLimit} productos</span>
              <EditableQuantity
                value={topLimit}
                className={cn("w-16 h-7 text-xs text-center font-bold")}
                onSubmit={(value) => {
                  const num = value as number;
                  if (num >= 1 && num <= data.length) {
                    setTopLimit(num);
                  } else if (num > data.length) {
                    setTopLimit(data.length);
                  } else {
                    setTopLimit(1);
                  }
                }}
                validate={(val) => {
                  const num = parseInt(val);
                  return !isNaN(num) && num > 0;
                }}
              />
            </Label>
            <div className="flex-1 max-w-md">
              <Slider
                value={[topLimit]}
                onValueChange={(value) => setTopLimit(value[0])}
                min={1}
                max={data.length}
                step={data.length > 100 ? 5 : 1}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              de {data.length} total
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {isError && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex-shrink-0">
          <strong>Error:</strong> {(error as Error)?.message || "No se pudo cargar el reporte"}
        </div>
      )}

      {/* Contenido principal - Tabla o Gráfico */}
      <div className="flex-1 min-h-0">
        {viewMode === "chart" ? (
          <UtilidadesChart data={data} limit={topLimit} />
        ) : (
          <div className="h-full bg-background rounded-lg border border-border flex flex-col">
            {/* Info de resultados */}
            <div className="p-2 text-sm text-muted-foreground border-b border-border flex-shrink-0">
              {!shouldFetch
                ? "Presiona 'Buscar' para cargar el reporte"
                : data.length > 0
                  ? `Mostrando ${data.length} productos`
                  : "Sin resultados"}
            </div>

            {/* Tabla */}
            <div className="flex-1 min-h-0">
              <VirtualizedCustomizableTable
                table={table}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                errorMessage="Error al cargar el reporte de utilidades"
                noDataMessage="No se encontraron productos en el período seleccionado"
                rows={20}
                enableColumnReordering
                enableSorting
                estimatedRowHeight={50}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default UtilidadesReportScreen;
