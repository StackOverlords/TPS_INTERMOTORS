import { useMemo, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { Badge } from "@/components/atoms/badge";
import { TableCell, TableRow } from "@/components/atoms/table";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import { formatCurrency } from "@/utils/formaters";
import { Award } from "lucide-react";
import type { PurchaseReportMayorCostoItem } from "../../types/purchaseReport.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseMayorCostoReportTableProps {
  data: PurchaseReportMayorCostoItem[];
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatNumber = (value: number, decimals = 2) =>
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

export function PurchaseMayorCostoReportTable({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
}: PurchaseMayorCostoReportTableProps) {
  const user = authSDK.getCurrentUser();
  const tableRef = useRef<HTMLTableElement>(null);

  const maxSubtotal = useMemo(
    () => Math.max(...data.map((d) => d.subtotal), 1),
    [data]
  );

  const columns = useMemo<ColumnDef<PurchaseReportMayorCostoItem>[]>(
    () => [
      {
        id: "ranking",
        header: "# Ranking",
        cell: ({ row }) => (
          <div className="flex items-center">
            {getRankingCell(row.index + 1)}
          </div>
        ),
        enableSorting: false,
        size: 60,
        minSize: 55,
      },

      {
        accessorKey: "codigo",
        header: "Código",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {getValue<string>()}
          </span>
        ),
        size: 150,
        minSize: 110,
      },

      {
        accessorKey: "producto",
        header: "Producto",
        cell: ({ getValue }) => (
          <span
            className="text-xs font-medium line-clamp-2 block max-w-[280px]"
            title={getValue<string>()}
          >
            {getValue<string>()}
          </span>
        ),
        size: 300,
        minSize: 200,
      },

      {
        accessorKey: "grupo",
        header: "Grupo",
        cell: ({ getValue }) => (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 whitespace-nowrap"
          >
            {getValue<string>()}
          </Badge>
        ),
        size: 180,
        minSize: 130,
      },

      {
        accessorKey: "linea",
        header: "Línea",
        cell: ({ getValue }) => (
          <span className="text-xs font-medium">{getValue<string>()}</span>
        ),
        size: 110,
        minSize: 80,
      },

      {
        accessorKey: "cantidad",
        header: "Cantidad",
        cell: ({ getValue }) => (
          <div className="text-right text-xs font-semibold tabular-nums">
            {formatNumber(getValue<number>(), 0)}
          </div>
        ),
        size: 90,
        minSize: 70,
      },

      {
        accessorKey: "costo_medio",
        header: "Costo Medio",
        cell: ({ getValue }) => (
          <div className="text-right text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {formatCurrency(getValue<number>())}
          </div>
        ),
        size: 120,
        minSize: 100,
      },

      {
        accessorKey: "subtotal",
        header: "Subtotal",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          const pct = Math.round((val / maxSubtotal) * 100);
          return (
            <div className="flex items-center gap-2 pr-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-12">
                <div
                  className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-blue-700 dark:text-blue-400 w-24 text-right shrink-0">
                {formatCurrency(val)}
              </span>
            </div>
          );
        },
        size: 200,
        minSize: 160,
      },
    ],
    [maxSubtotal]
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
    persistenceKey: `purchase-mayor-costo-report-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
    persistColumnSizing: true,
  });

  const totals = useMemo(
    () => ({
      cantidad: data.reduce((sum, item) => sum + item.cantidad, 0),
      subtotal: data.reduce((sum, item) => sum + item.subtotal, 0),
    }),
    [data]
  );

  const renderTotalsRow = () => {
    const visibleColumns = table.getVisibleLeafColumns();

    return (
      <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
        {visibleColumns.map((column) => {
          const id = column.id;

          if (id === "cantidad") {
            return (
              <TableCell
                key={id}
                className="p-2 text-right"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total unidades
                </div>
                <div className="text-xs font-bold">
                  {formatNumber(totals.cantidad, 0)}
                </div>
              </TableCell>
            );
          }

          if (id === "subtotal") {
            return (
              <TableCell
                key={id}
                className="p-2 text-right"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total invertido
                </div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 text-right pr-2">
                  {formatCurrency(totals.subtotal)}
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
      errorMessage="Error al cargar el ranking de mayor costo"
      noDataMessage="Sin datos de ranking"
      noDataDescription="Ajusta el rango de fechas, el ranking o la sucursal."
      tableRef={tableRef}
      enableColumnReordering={true}
      stickyHeader={true}
      rows={data.length}
      renderTableFooter={renderTotalsRow}
    />
  );
}
