import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
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
  Calendar,
  Receipt,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useGeneralReport, useDownloadGeneralReport } from "../hooks/useAccountsReceivableReports";
import type {
  AccountsReceivableGeneralFilters,
  AccountsReceivableItem,
  AccountsReceivableStats,
} from "../types/AccountsReceivableReport.types";
import { subMonths, format } from "date-fns";
import { showErrorToast } from "@/hooks/use-toast-enhanced";

const AccountsReceivableGeneralReportScreen = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [fechaInicio, setFechaInicio] = useState<string>(
    format(subMonths(new Date(), 1), "yyyy-MM-dd")
  );
  const [fechaFin, setFechaFin] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [shouldFetch, setShouldFetch] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<AccountsReceivableGeneralFilters>({
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
  });

  const { data: reportData, isLoading, isFetching, isError, error, refetch } =
    useGeneralReport({
      filters: appliedFilters,
      enabled: shouldFetch,
    });

  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadGeneralReport();

  const data = reportData?.data ?? [];

  // Calcular estadísticas
  const stats: AccountsReceivableStats = useMemo(() => {
    const totalVentas = data.reduce(
      (sum, item) => sum + parseFloat(item.total.toString()),
      0
    );
    const totalPagos = data.reduce(
      (sum, item) => sum + parseFloat(item.pagos.toString()),
      0
    );
    const totalSaldo = data.reduce(
      (sum, item) => sum + parseFloat(item.saldo.toString()),
      0
    );
    const porcentajeCobrado = totalVentas > 0 ? (totalPagos / totalVentas) * 100 : 0;
    const cuentasPendientes = data.filter(
      (item) => parseFloat(item.saldo.toString()) > 0
    ).length;
    const cuentasPagadas = data.filter(
      (item) => parseFloat(item.saldo.toString()) === 0
    ).length;

    return {
      totalItems: data.length,
      totalVentas,
      totalPagos,
      totalSaldo,
      porcentajeCobrado,
      cuentasPendientes,
      cuentasPagadas,
    };
  }, [data]);

  // Columnas de la tabla
  const columns = useMemo<ColumnDef<AccountsReceivableItem>[]>(
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
        accessorKey: "nro_venta",
        header: "Nro Venta",
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="font-mono font-medium">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="text-sm">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "cliente",
        header: "Cliente",
        size: 300,
        minSize: 200,
        cell: ({ getValue }) => (
          <div className="font-medium text-primary">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        size: 140,
        minSize: 100,
        cell: ({ getValue }) => {
          const total = parseFloat(getValue<string>());
          return (
            <div className="text-right">
              <span className="font-medium text-blue-600">
                Bs. {total.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "pagos",
        header: "Pagos",
        size: 140,
        minSize: 100,
        cell: ({ getValue }) => {
          const pagos = parseFloat(getValue<string>());
          return (
            <div className="text-right">
              <span className="font-medium text-green-600">
                Bs. {pagos.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "saldo",
        header: "Saldo",
        size: 140,
        minSize: 100,
        cell: ({ getValue }) => {
          const saldo = parseFloat(getValue<string>());
          return (
            <div className="text-right">
              <Badge
                variant={saldo > 0 ? "danger" : "success"}
                className="rounded font-bold"
              >
                Bs. {saldo.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Badge>
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
    persistenceKey: "accounts-receivable-general-report-table",
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleSearch = () => {
    if (!selectedBranchId) {
      showErrorToast({
        title: "Sucursal requerida",
        description: "Por favor selecciona una sucursal para generar el reporte",
      });
      return;
    }

    const filters: AccountsReceivableGeneralFilters = {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      sucursal: Number(selectedBranchId),
    };

    setAppliedFilters(filters);

    if (!shouldFetch) {
      setShouldFetch(true);
    } else {
      refetch();
    }
  };

  const handleDownload = () => {
    downloadReport(appliedFilters);
  };

  const setLastWeek = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setFechaInicio(format(start, "yyyy-MM-dd"));
    setFechaFin(format(end, "yyyy-MM-dd"));
  };

  const setLastMonth = () => {
    setFechaInicio(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
    setFechaFin(format(new Date(), "yyyy-MM-dd"));
  };

  const setLast3Months = () => {
    setFechaInicio(format(subMonths(new Date(), 3), "yyyy-MM-dd"));
    setFechaFin(format(new Date(), "yyyy-MM-dd"));
  };

  return (
    <main className="h-full p-4 gap-4 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reporte General de Cuentas por Cobrar
          </h1>
          <p className="text-muted-foreground">
            Estado de cuentas pendientes de cobro
          </p>
        </div>
      </header>

      {/* Filtros */}
      <section className="bg-background rounded-lg p-3 border border-border flex-shrink-0 space-y-3">
        {/* Shortcuts de fechas */}
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
        </div>

        {/* Controles principales */}
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

      {/* Stats */}
      <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
              <Receipt className="size-4 text-primary" />
              <span className="font-semibold text-primary">{stats.totalItems}</span>
            </div>
            <span className="text-muted-foreground hidden sm:inline">cuentas</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10">
            <AlertCircle className="size-4 text-red-600" />
            <span className="font-semibold text-red-600">
              Bs. {stats.totalSaldo.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-red-600/70 text-xs">por cobrar</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10">
            <TrendingUp className="size-4 text-green-600" />
            <span className="font-semibold text-green-600">{stats.porcentajeCobrado.toFixed(1)}%</span>
            <span className="text-green-600/70 text-xs">cobrado</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {isError && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex-shrink-0">
          <strong>Error:</strong> {(error as Error)?.message || "No se pudo cargar el reporte"}
        </div>
      )}

      {/* Tabla */}
      <div className="flex-1 min-h-0">
        <div className="h-full bg-background rounded-lg border border-border flex flex-col">
          <div className="p-2 text-sm text-muted-foreground border-b border-border flex-shrink-0">
            {!shouldFetch
              ? "Presiona 'Buscar' para cargar el reporte"
              : data.length > 0
                ? `Mostrando ${data.length} cuentas - ${stats.cuentasPendientes} pendientes, ${stats.cuentasPagadas} pagadas`
                : "Sin resultados"}
          </div>

          <div className="flex-1 min-h-0">
            <VirtualizedCustomizableTable
              table={table}
              isLoading={isLoading}
              isFetching={isFetching}
              isError={isError}
              errorMessage="Error al cargar el reporte de cuentas por cobrar"
              noDataMessage="No se encontraron cuentas en el período seleccionado"
              rows={20}
              enableColumnReordering
              enableSorting
              estimatedRowHeight={50}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default AccountsReceivableGeneralReportScreen;
