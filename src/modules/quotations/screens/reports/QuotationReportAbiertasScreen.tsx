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
  Clock,
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useQuotationReportAbiertas } from "../../hooks/queries/reports/useQuotationReportAbiertas";
import type { QuotationReportAbiertasItem } from "../../types/quotationReports.types";
import { cn } from "@/lib/utils";

const DIAS_MINIMOS_DEFAULT = 30;

const getDiasVariant = (dias: number) => {
  if (dias < 30) return "success" as const;
  if (dias <= 60) return "warning" as const;
  return "danger" as const;
};

const columns: ColumnDef<QuotationReportAbiertasItem>[] = [
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
    accessorKey: "fecha_quo",
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
    size: 220,
    minSize: 140,
    cell: ({ getValue }) => (
      <div className="font-medium">{getValue<string>()}</div>
    ),
  },
  {
    accessorKey: "cliente_telefono",
    header: "Teléfono",
    size: 120,
    minSize: 100,
    cell: ({ getValue }) => {
      const tel = getValue<string | undefined>();
      return (
        <div className="text-sm text-muted-foreground">
          {tel ?? "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "responsable",
    header: "Responsable",
    size: 160,
    minSize: 120,
    cell: ({ getValue }) => (
      <div className="text-sm">{getValue<string>()}</div>
    ),
  },
  {
    accessorKey: "dias_abierta",
    header: "Días Abierta",
    size: 120,
    minSize: 100,
    cell: ({ getValue }) => {
      const dias = getValue<number>();
      return (
        <div className="text-center">
          <Badge variant={getDiasVariant(dias)} className="rounded font-bold">
            {dias} días
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "comentarios",
    header: "Comentarios",
    size: 260,
    minSize: 140,
    cell: ({ getValue }) => {
      const comentarios = getValue<string | undefined>();
      return (
        <div className="text-sm text-muted-foreground truncate max-w-[240px]">
          {comentarios ?? "-"}
        </div>
      );
    },
  },
];

const QuotationReportAbiertasScreen = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [diasMinimos, setDiasMinimos] = useState<number>(DIAS_MINIMOS_DEFAULT);
  const [shouldFetch, setShouldFetch] = useState(false);

  // fecha_inicio requerido por validación del DTO pero ignorado por la query
  const filters = {
    fecha_inicio: "2000-01-01",
    sucursal: Number(selectedBranchId) || null,
    dias_minimos: diasMinimos,
  };

  const {
    data: reportData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuotationReportAbiertas({ filters, enabled: shouldFetch });

  const data = reportData?.data ?? [];

  const { table } = useCustomTable({
    data,
    columns,
    enableColumnResizing: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    columnResizeMode: "onChange",
    persistenceKey: "quotation-report-abiertas-table",
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const handleSearch = () => {
    if (!shouldFetch) {
      setShouldFetch(true);
    } else {
      refetch();
    }
  };

  const urgentes = data.filter((item) => (item.dias_abierta ?? 0) > 60).length;
  const enEspera = data.filter(
    (item) => (item.dias_abierta ?? 0) >= 30 && (item.dias_abierta ?? 0) <= 60
  ).length;

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      {/* Header */}
      <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 dark:bg-amber-400/10 p-2">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight tracking-tight">
                Cotizaciones Abiertas
              </h1>
              <p className="text-sm text-muted-foreground">
                Cotizaciones pendientes de conversión o cierre
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <section className="border-t border-border pt-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="dias-minimos" className="text-sm whitespace-nowrap">
                Días mínimos abierta:
              </Label>
              <Input
                id="dias-minimos"
                type="number"
                min={0}
                value={diasMinimos}
                onChange={(e) =>
                  setDiasMinimos(Math.max(0, Number(e.target.value) || 0))
                }
                className="w-20 h-8"
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

      {/* Contenido */}
      <div className="flex-1 min-h-0">
        <div className="bg-background rounded-lg border border-border flex flex-col h-full">
          {/* Toolbar interno */}
          <div className="flex flex-col flex-shrink-0 p-2 gap-2 border-b border-border">
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
                  <FileSpreadsheet className="size-4 text-primary" />
                  <span className="font-semibold text-primary">
                    {data.length}
                  </span>
                  <span className="text-primary hidden sm:inline">
                    cotizaciones
                  </span>
                </div>

                {urgentes > 0 && (
                  <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 dark:bg-red-500/20">
                    <Clock className="size-4 text-red-600 dark:text-red-400" />
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {urgentes}
                    </span>
                    <span className="text-red-600/70 dark:text-red-400/70 text-xs">
                      urgentes (+60 días)
                    </span>
                  </div>
                )}

                {enEspera > 0 && (
                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
                    <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {enEspera}
                    </span>
                    <span className="text-amber-600/70 dark:text-amber-400/70 text-xs">
                      en espera (30-60 días)
                    </span>
                  </div>
                )}
              </div>

              {(isFetching || isLoading) && (
                <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando datos...
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <span className="text-sm text-muted-foreground">
                {!shouldFetch
                  ? "Presioná 'Buscar' para cargar el reporte"
                  : data.length > 0
                    ? `Mostrando ${data.length} cotizaciones abiertas`
                    : "Sin resultados para los filtros aplicados"}
              </span>
            </div>
          </div>

          {/* Tabla */}
          <div className="flex-1 min-h-0">
            <VirtualizedCustomizableTable
              table={table}
              isLoading={isLoading}
              isFetching={isFetching}
              isError={isError}
              errorMessage="Error al cargar el reporte de cotizaciones abiertas"
              noDataMessage="Ajustá los filtros y presioná 'Buscar' para cargar el reporte."
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

export default QuotationReportAbiertasScreen;
