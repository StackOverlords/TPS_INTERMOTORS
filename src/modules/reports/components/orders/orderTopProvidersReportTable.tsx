import { useMemo, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { TableCell, TableRow } from "@/components/atoms/table";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import { formatCurrency } from "@/utils/formaters";
import { Award } from "lucide-react";
import type { OrderReportTopProveedoresItem } from "../../types/orderReport.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderTopProveedoresReportTableProps {
  data: OrderReportTopProveedoresItem[];
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatNumber = (value: number, decimals = 0) =>
  value.toLocaleString("es-BO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const getRankingCell = (rank: number) => {
  if (rank === 1)
    return (
      <span className="flex gap-2 font-semibold px-2">
        <Award className="size-4 text-yellow-500 hover:text-yellow-600" /> 1°
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex gap-2 font-semibold px-2">
        <Award className="size-4 text-gray-400 hover:text-gray-500" /> 2°
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex gap-2 font-semibold px-2">
        <Award className="size-4 text-orange-600 hover:text-orange-700" /> 3°
      </span>
    );
  return <span className="font-medium px-2">{rank}°</span>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderTopProveedoresReportTable({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
}: OrderTopProveedoresReportTableProps) {
  const user = authSDK.getCurrentUser();
  const tableRef = useRef<HTMLTableElement>(null);

  const maxApariciones = useMemo(
    () => Math.max(...data.map((d) => d.apariciones), 1),
    [data]
  );

  const maxMonto = useMemo(
    () => Math.max(...data.map((d) => d.monto_total), 1),
    [data]
  );

  const columns = useMemo<ColumnDef<OrderReportTopProveedoresItem>[]>(
    () => [
      {
        id: "ranking",
        header: "# Ranking",
        cell: ({ row }) => (
          <div className="flex items-center px-2">
            {getRankingCell(row.index + 1)}
          </div>
        ),
        enableSorting: false,
        size: 60,
        minSize: 55,
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
        accessorKey: "apariciones",
        header: "Apariciones",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          const pct = Math.round((val / maxApariciones) * 100);
          return (
            <div className="flex items-center gap-2 pr-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-12">
                <div
                  className="h-full bg-violet-500 dark:bg-violet-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-violet-700 dark:text-violet-400 w-12 text-right shrink-0">
                {formatNumber(val)}
              </span>
            </div>
          );
        },
        size: 160,
        minSize: 130,
      },

      {
        accessorKey: "ordenes",
        header: "Órdenes",
        cell: ({ getValue }) => (
          <div className="text-center text-xs font-semibold tabular-nums">
            {getValue<number>()}
          </div>
        ),
        size: 90,
        minSize: 70,
      },

      {
        accessorKey: "monto_total",
        header: "Monto Total",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          const pct = Math.round((val / maxMonto) * 100);
          return (
            <div className="flex items-center gap-2 pr-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-12">
                <div
                  className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400 w-28 text-right shrink-0">
                {formatCurrency(val)}
              </span>
            </div>
          );
        },
        size: 220,
        minSize: 180,
      },
    ],
    [maxApariciones, maxMonto]
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
    persistenceKey: `order-top-proveedores-report-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
    persistColumnSizing: true,
  });

  const totals = useMemo(
    () => ({
      apariciones: data.reduce((sum, item) => sum + item.apariciones, 0),
      ordenes: data.reduce((sum, item) => sum + item.ordenes, 0),
      monto_total: data.reduce((sum, item) => sum + item.monto_total, 0),
    }),
    [data]
  );

  const renderTotalsRow = () => {
    const visibleColumns = table.getVisibleLeafColumns();

    return (
      <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
        {visibleColumns.map((column) => {
          const id = column.id;

          if (id === "apariciones") {
            return (
              <TableCell
                key={id}
                className="p-2 text-right"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total apariciones
                </div>
                <div className="text-xs font-bold text-violet-600 dark:text-violet-400 pr-2">
                  {formatNumber(totals.apariciones)}
                </div>
              </TableCell>
            );
          }

          if (id === "ordenes") {
            return (
              <TableCell
                key={id}
                className="p-2 text-center"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total órdenes
                </div>
                <div className="text-xs font-bold">{totals.ordenes}</div>
              </TableCell>
            );
          }

          if (id === "monto_total") {
            return (
              <TableCell
                key={id}
                className="p-2 text-right"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total invertido
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 pr-2">
                  {formatCurrency(totals.monto_total)}
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
      errorMessage="Error al cargar el ranking de proveedores"
      noDataMessage="Sin datos de ranking"
      noDataDescription="Ajusta el rango de fechas, el top_n o la sucursal."
      tableRef={tableRef}
      enableColumnReordering={true}
      stickyHeader={true}
      rows={data.length}
      renderTableFooter={renderTotalsRow}
    />
  );
}
