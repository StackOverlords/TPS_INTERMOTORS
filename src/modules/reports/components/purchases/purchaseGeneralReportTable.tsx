import { useMemo, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { Badge } from "@/components/atoms/badge";
import { TableCell, TableRow } from "@/components/atoms/table";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import { formatCurrency } from "@/utils/formaters";
import type { PurchaseReportGeneralItem } from "../../types/purchaseReport.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseGeneralReportTableProps {
  data: PurchaseReportGeneralItem[];
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  showRowNumbers?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatNumber = (value: number, decimals = 2) =>
  value.toLocaleString("es-BO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

// Colores por grupo para diferenciar visualmente
const GROUP_COLORS: Record<
  string,
  "default" | "success" | "warning" | "accent" | "info" | "secondary"
> = {
  PISTON: "accent",
  ANILLA: "info",
  "COJINETE DE BIELA": "success",
  "COJINETE DE BANCADA": "warning",
  "EMPAQUETADURA DE CULATA": "secondary",
  BUJIA: "default",
};

const getGroupVariant = (
  grupo: string
): "default" | "success" | "warning" | "accent" | "info" | "secondary" => {
  return GROUP_COLORS[grupo] ?? "outline";
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PurchaseGeneralReportTable({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
  showRowNumbers = false,
}: PurchaseGeneralReportTableProps) {
  const user = authSDK.getCurrentUser();
  const tableRef = useRef<HTMLTableElement>(null);

  const columns = useMemo<ColumnDef<PurchaseReportGeneralItem>[]>(
    () => [
      ...(showRowNumbers
        ? [
            {
              id: "ranking",
              header: "#",
              cell: ({ row }: any) => (
                <span className="font-medium px-2 text-muted-foreground">
                  {row.index + 1}
                </span>
              ),
              enableSorting: false,
              size: 50,
              minSize: 50,
            } satisfies ColumnDef<PurchaseReportGeneralItem>,
          ]
        : []),

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
            variant={getGroupVariant(getValue<string>())}
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
          <span className="text-xs font-medium text-foreground/80">
            {getValue<string>()}
          </span>
        ),
        size: 110,
        minSize: 80,
      },

      {
        accessorKey: "ubicacion",
        header: "Ubicación",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {getValue<string>()}
          </span>
        ),
        size: 90,
        minSize: 70,
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
    [showRowNumbers]
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
    persistenceKey: `purchase-general-report-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
    persistColumnSizing: true,
  });

  // ── Footer totals ─────────────────────────────────────────────────────────

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
      errorMessage="Error al cargar el reporte de compras"
      noDataMessage="No hay compras registradas"
      noDataDescription="Ajusta el rango de fechas o la sucursal seleccionada."
      tableRef={tableRef}
      enableColumnReordering={true}
      stickyHeader={true}
      rows={data.length}
      renderTableFooter={renderTotalsRow}
    />
  );
}
