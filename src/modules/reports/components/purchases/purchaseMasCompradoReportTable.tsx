import { useMemo, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { Badge } from "@/components/atoms/badge";
import { TableCell, TableRow } from "@/components/atoms/table";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import { formatCurrency } from "@/utils/formaters";
import { Award } from "lucide-react";
import type { PurchaseReportMasCompradoItem } from "../../types/purchaseReport.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseMasCompradoReportTableProps {
  data: PurchaseReportMasCompradoItem[];
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

export function PurchaseMasCompradoReportTable({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
}: PurchaseMasCompradoReportTableProps) {
  const user = authSDK.getCurrentUser();
  const tableRef = useRef<HTMLTableElement>(null);

  const maxCantidad = useMemo(
    () => Math.max(...data.map((d) => d.cantidad), 1),
    [data]
  );

  const columns = useMemo<ColumnDef<PurchaseReportMasCompradoItem>[]>(
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
        cell: ({ getValue }) => {
          const val = getValue() as number;
          const pct = Math.round((val / maxCantidad) * 100);
          return (
            <div className="flex items-center gap-2 pr-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-12">
                <div
                  className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400 w-16 text-right shrink-0">
                {formatNumber(val, 0)}
              </span>
            </div>
          );
        },
        size: 160,
        minSize: 130,
      },

      {
        accessorKey: "costo_medio",
        header: "Costo Medio",
        cell: ({ getValue }) => (
          <div className="text-right text-xs tabular-nums">
            {formatCurrency(getValue<number>())}
          </div>
        ),
        size: 120,
        minSize: 100,
      },

      {
        accessorKey: "subtotal",
        header: "Subtotal",
        cell: ({ getValue }) => (
          <div className="text-right text-xs font-bold tabular-nums text-blue-600 dark:text-blue-400 mr-2">
            {formatCurrency(getValue<number>())}
          </div>
        ),
        size: 130,
        minSize: 110,
      },
    ],
    [maxCantidad]
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
    persistenceKey: `purchase-mas-comprado-report-table-${user?.name}`,
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
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
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
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
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
      errorMessage="Error al cargar el ranking de más comprados"
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
