import { useMemo, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { TableCell, TableRow } from "@/components/atoms/table";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import { cn } from "@/lib/utils";
import type { OrderReportTiempoMedioItem } from "../../types/orderReport.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderTiempoMedioReportTableProps {
  data: OrderReportTiempoMedioItem[];
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDays = (days: number): string => {
  if (days === 0) return "< 1 día";
  return `${days} d.`;
};

/** Clasifica el tiempo de entrega en categorías de color */
const getDeliveryColor = (days: number) => {
  if (days <= 15) return "text-emerald-600 dark:text-emerald-400";
  if (days <= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const getDeliveryBgBar = (days: number) => {
  if (days <= 15) return "bg-emerald-500 dark:bg-emerald-400";
  if (days <= 60) return "bg-amber-500 dark:bg-amber-400";
  return "bg-red-500 dark:bg-red-400";
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderTiempoMedioReportTable({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
}: OrderTiempoMedioReportTableProps) {
  const user = authSDK.getCurrentUser();
  const tableRef = useRef<HTMLTableElement>(null);

  const maxDias = useMemo(
    () =>
      Math.max(...data.map((d) => parseFloat(d.dias_promedio.toString())), 1),
    [data]
  );

  const columns = useMemo<ColumnDef<OrderReportTiempoMedioItem>[]>(
    () => [
      {
        id: "ranking",
        header: "#",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-muted-foreground px-2">
            {row.index + 1}
          </span>
        ),
        enableSorting: false,
        size: 50,
        minSize: 50,
      },

      {
        accessorKey: "proveedor",
        header: "Proveedor",
        cell: ({ getValue }) => (
          <span
            className="text-xs font-semibold line-clamp-1 block max-w-[280px]"
            title={getValue<string>()}
          >
            {getValue<string>()}
          </span>
        ),
        size: 300,
        minSize: 200,
      },

      {
        accessorKey: "ordenes_completadas",
        header: "Órdenes Completadas",
        cell: ({ getValue }) => (
          <div className="text-center text-xs font-semibold tabular-nums">
            {getValue<number>()}
          </div>
        ),
        size: 160,
        minSize: 130,
      },

      {
        accessorKey: "dias_promedio",
        header: "Tiempo Promedio",
        cell: ({ getValue }) => {
          const val = parseFloat(getValue<number>().toString());
          const pct = Math.round((val / maxDias) * 100);
          return (
            <div className="flex items-center gap-2 pr-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-12">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    getDeliveryBgBar(val)
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-bold tabular-nums w-16 text-right shrink-0",
                  getDeliveryColor(val)
                )}
              >
                {formatDays(Math.round(val))}
              </span>
            </div>
          );
        },
        size: 180,
        minSize: 150,
      },

      {
        accessorKey: "dias_minimo",
        header: "Mín.",
        cell: ({ getValue }) => (
          <div className="text-right text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatDays(getValue<number>())}
          </div>
        ),
        size: 80,
        minSize: 65,
      },

      {
        accessorKey: "dias_maximo",
        header: "Máx.",
        cell: ({ getValue }) => (
          <div className="text-right text-xs font-semibold tabular-nums text-red-600 dark:text-red-400 mr-2">
            {formatDays(getValue<number>())}
          </div>
        ),
        size: 80,
        minSize: 65,
      },
    ],
    [maxDias]
  );

  const { table } = useCustomTable({
    data,
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: false,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,
    hiddenColumns: [],
    columnResizeMode: "onChange",
    persistenceKey: `order-tiempo-medio-report-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
    persistColumnSizing: true,
  });

  const avgGlobal = useMemo(() => {
    if (!data.length) return 0;
    const total = data.reduce(
      (sum, item) => sum + parseFloat(item.dias_promedio.toString()),
      0
    );
    return total / data.length;
  }, [data]);

  const renderTotalsRow = () => {
    const visibleColumns = table.getVisibleLeafColumns();

    return (
      <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
        {visibleColumns.map((column) => {
          const id = column.id;

          if (id === "ordenes_completadas") {
            return (
              <TableCell
                key={id}
                className="p-2 text-center"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total órdenes
                </div>
                <div className="text-xs font-bold">
                  {data.reduce(
                    (sum, item) => sum + item.ordenes_completadas,
                    0
                  )}
                </div>
              </TableCell>
            );
          }

          if (id === "dias_promedio") {
            return (
              <TableCell
                key={id}
                className="p-2 text-right"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Promedio global
                </div>
                <div
                  className={cn(
                    "text-xs font-bold pr-2",
                    getDeliveryColor(avgGlobal)
                  )}
                >
                  {formatDays(Math.round(avgGlobal))}
                </div>
              </TableCell>
            );
          }

          return (
            <TableCell
              key={id}
              className="p-2"
              style={{ width: column.getSize() }}
            />
          );
        })}
      </TableRow>
    );
  };

  return (
    <VirtualizedCustomizableTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      errorMessage="Error al cargar el reporte de tiempo medio"
      noDataMessage="Sin datos de tiempo de entrega"
      noDataDescription="Ajusta el rango de fechas o la sucursal."
      tableRef={tableRef}
      enableColumnReordering={true}
      stickyHeader={true}
      rows={data.length}
      renderTableFooter={renderTotalsRow}
    />
  );
}
