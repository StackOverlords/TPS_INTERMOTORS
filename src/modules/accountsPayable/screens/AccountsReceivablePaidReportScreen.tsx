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
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  AccountsReceivablePaidFilters,
  AccountsReceivableItem,
  AccountsReceivableStats,
} from "../types/AccountsReceivableReport.types";
import { subMonths, format } from "date-fns";
import { showErrorToast } from "@/hooks/use-toast-enhanced";
import { formatCurrency } from "@/utils/formaters";
import { parseDateForUi } from "@/utils/dateFormatters";
import {
  useAccountsReceivablePaidReport,
  useDownloadAccountsReceivablePaidReport,
} from "../hooks/useAccountsReceivablePaidReport";

const AccountsReceivablePaidReportScreen = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [fechaInicio, setFechaInicio] = useState<string>(
    format(subMonths(new Date(), 1), "yyyy-MM-dd")
  );
  const [fechaFin, setFechaFin] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [shouldFetch, setShouldFetch] = useState(false);

  const [appliedFilters, setAppliedFilters] =
    useState<AccountsReceivablePaidFilters>({
      pago_fecha_ini: fechaInicio,
      pago_fecha_fin: fechaFin,
    });

  const {
    data: reportData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAccountsReceivablePaidReport(appliedFilters, shouldFetch);

  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadAccountsReceivablePaidReport();

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
    const porcentajeCobrado =
      totalVentas > 0 ? (totalPagos / totalVentas) * 100 : 0;
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
          <div className="text-center text-xs font-semibold text-muted-foreground">
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
          <div className="text-sm">{parseDateForUi(getValue<string>())}</div>
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
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {formatCurrency(total)}
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
              <Badge variant="success" className="rounded font-bold">
                <CheckCircle2 className="size-3 mr-1" />
                Bs. {formatCurrency(pagos)}
              </Badge>
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
                {formatCurrency(saldo)}
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
    persistenceKey: "accounts-receivable-paid-report-table",
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
        description:
          "Por favor selecciona una sucursal para generar el reporte",
      });
      return;
    }

    const filters: AccountsReceivablePaidFilters = {
      pago_fecha_ini: fechaInicio,
      pago_fecha_fin: fechaFin,
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
    <main className="h-full p-2 gap-2 flex flex-col">
      {/* Header */}
      <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                Reporte de Cuentas Efectivamente Pagadas
              </h1>
              <p className="text-sm text-muted-foreground">
                Pagos realizados en el período seleccionado
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end w-full sm:w-auto gap-2"></div>
        </div>

        {/* Filtros Compactos */}
        <section className="border-t border-border pt-2 space-y-2">
          {/* Shortcuts de fechas */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              Rápido:
            </span>
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
                Pagos desde:
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

            <Button
              variant="default"
              onClick={handleSearch}
              disabled={isFetching}
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
                <Download
                  className={`size-4 mr-2 ${isDownloading ? "animate-pulse" : ""}`}
                />
                {isDownloading ? "Descargando..." : "Exportar"}
              </Button>
            </div>
          </div>
        </section>
      </header>

      {/* Error Message */}
      {isError && error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm flex-shrink-0">
          <strong>Error:</strong>{" "}
          {(error as Error)?.message || "No se pudo cargar el reporte"}
        </div>
      )}

      {/* Tabla */}
      <div className="flex-1 min-h-0">
        <div className="h-full bg-background rounded-lg border border-border flex flex-col">
          <div className="border-b border-border p-2 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {!shouldFetch
                ? "Presiona 'Buscar' para cargar el reporte"
                : data.length > 0
                  ? `Mostrando ${data.length} cuentas pagadas`
                  : "Sin resultados"}
            </div>

            <div className="flex items-center gap-2 text-sm">
              {/* Indicador de carga mientras refetch */}
              {(isFetching || isLoading) && (
                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando datos... Este proceso puede tardar.
                </div>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
                <CreditCard className="size-4 text-primary" />
                <span className="font-semibold text-primary">
                  {stats.totalItems}
                </span>
                <span className="text-primary hidden sm:inline">pagos</span>
              </div>

              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10">
                <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(stats.totalPagos)}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                  cobrado
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10">
                <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {stats.cuentasPagadas}
                </span>
                <span className="text-blue-600 dark:text-blue-400 text-xs">
                  completadas
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <VirtualizedCustomizableTable
              table={table}
              isLoading={isLoading}
              isFetching={isFetching}
              isError={isError}
              errorMessage="Error al cargar el reporte de cuentas pagadas"
              noDataMessage="No se encontraron cuentas pagadas en el período seleccionado"
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

export default AccountsReceivablePaidReportScreen;
