import { useMemo, useRef } from "react";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { Badge } from "@/components/atoms/badge";
import { TableCell, TableRow } from "@/components/atoms/table";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import { formatCurrency } from "@/utils/formaters";
import type { KardexReportItem } from "../../types/kardexReport.types";
import { ArrowDown, ArrowUp } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRANSACTION_TYPES: Record<string, { label: string }> = {
  C: { label: "Compra" },
  V: { label: "Venta" },
  D: { label: "Devolución" },
  SA: { label: "Saldo Ant." },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface KardexReportTableProps {
  data: KardexReportItem[];
  isLoading?: boolean;
  isFetching?: boolean;
  initialSorting?: SortingState;
  rows?: number;
  isError?: boolean;
  showRowNumbers?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatNumber = (value: string | number, decimals: number = 2): string => {
  const num = typeof value === "string" ? parseFloat(value.toString()) : value;
  return num.toLocaleString("es-BO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Maps tipo_transaccion codes to Badge variant + label.
 *
 *  C  → Compra      (success / green)
 *  V  → Venta       (warning / orange)
 *  D  → Devolución  (accent  / purple)
 *  SA → Saldo Ini.  (outline / neutral)
 * TI → Transfer In  (info    / cyan)
 * TS → Transfer Out (secondary / blue)
 *
 */
const getTransactionBadge = (tipo: string) => {
  const t = TRANSACTION_TYPES[tipo] || { label: tipo };

  const variantMap: Record<
    string,
    "success" | "warning" | "accent" | "outline" | "info" | "secondary"
  > = {
    C: "success",
    V: "warning",
    D: "accent",
    SA: "outline",
    TI: "info",
    TS: "secondary",
  };

  return (
    <Badge
      variant={variantMap[tipo] ?? "outline"}
      className="text-xs px-2 py-0.5 whitespace-nowrap"
    >
      {t.label}
    </Badge>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export function KardexReportTable({
  data,
  isLoading = false,
  isFetching = false,
  initialSorting,
  rows,
  isError = false,
  showRowNumbers = false,
}: KardexReportTableProps) {
  const user = authSDK.getCurrentUser();
  const tableRef = useRef<HTMLTableElement>(null);

  // ── Column definitions ────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<KardexReportItem>[]>(
    () => [
      // Optional row-number ranking column
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
              size: 60,
              minSize: 60,
            } satisfies ColumnDef<KardexReportItem>,
          ]
        : []),

      // Fecha
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: ({ getValue }: any) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {getValue()}
          </span>
        ),
        size: 110,
        minSize: 90,
      },

      // Tipo de transacción
      {
        accessorKey: "tipo_transaccion",
        header: "Tipo",
        cell: ({ getValue }: any) => getTransactionBadge(getValue()),
        size: 120,
        minSize: 100,
      },

      // N° Transacción
      {
        accessorKey: "num_transaccion",
        header: "N° Transacción",
        cell: ({ getValue }: any) => (
          <span className="font-mono text-xs">{getValue()}</span>
        ),
        size: 160,
        minSize: 130,
      },

      // Proveedor / Cliente
      {
        accessorKey: "proveedor_cliente",
        header: "Proveedor / Cliente",
        cell: ({ getValue }: any) => (
          <span
            className="text-xs line-clamp-2 truncate block max-w-[200px]"
            title={getValue()}
          >
            {getValue() || "—"}
          </span>
        ),
        size: 220,
        minSize: 150,
      },

      // Cantidad
      {
        accessorKey: "cantidad",
        header: "Cantidad",
        cell: ({ getValue }: any) => (
          <div className="text-right text-xs font-medium">
            {formatNumber(getValue(), 0)}
          </div>
        ),
        size: 80,
        minSize: 70,
      },

      // Costo unitario (entrada)
      {
        accessorKey: "entrada_costo",
        header: "Costo Unit.",
        cell: ({ getValue, row }: any) => {
          const isEntry =
            row.original.tipo_transaccion === "C" ||
            row.original.tipo_transaccion === "D";
          const value = parseFloat(getValue()?.toString() ?? "0");
          return (
            <div
              className={cn(
                "text-right text-xs",
                isEntry && value > 0 && "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {formatCurrency(value)}
            </div>
          );
        },
        size: 120,
        minSize: 100,
      },

      // Entrada total
      {
        accessorKey: "entrada_total",
        header: "Entrada Total",
        cell: ({ getValue, row }: any) => {
          const isEntry =
            row.original.tipo_transaccion === "C" ||
            row.original.tipo_transaccion === "D";
          const value = parseFloat(getValue()?.toString() ?? "0");
          return (
            <div
              className={cn(
                "text-right text-xs font-semibold",
                isEntry && value > 0 && "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {formatCurrency(value)}
            </div>
          );
        },
        size: 130,
        minSize: 110,
      },

      // Precio unitario (salida)
      {
        accessorKey: "salida_precio",
        header: "Precio Unit.",
        cell: ({ getValue, row }: any) => {
          const isExit = row.original.tipo_transaccion === "V";
          const value = parseFloat(getValue()?.toString() ?? "0");
          return (
            <div
              className={cn(
                "text-right text-xs",
                isExit && value > 0 && "text-amber-600 dark:text-amber-400"
              )}
            >
              {formatCurrency(value)}
            </div>
          );
        },
        size: 120,
        minSize: 100,
      },

      // Salida total
      {
        accessorKey: "salida_total",
        header: "Salida Total",
        cell: ({ getValue, row }: any) => {
          const isExit = row.original.tipo_transaccion === "V";
          const value = parseFloat(getValue()?.toString() ?? "0");
          return (
            <div
              className={cn(
                "text-right text-xs font-semibold",
                isExit && value > 0 && "text-amber-600 dark:text-amber-400"
              )}
            >
              {formatCurrency(value)}
            </div>
          );
        },
        size: 130,
        minSize: 110,
      },

      // Saldo
      {
        accessorKey: "saldo",
        header: "Saldo",
        cell: ({ getValue }: any) => (
          <div className="text-right text-xs font-bold mr-2">
            {formatNumber(getValue(), 0)}
          </div>
        ),
        size: 90,
        minSize: 70,
      },
    ],
    [showRowNumbers]
  );

  // ── Table instance ────────────────────────────────────────────────────────

  const { table } = useCustomTable({
    data,
    columns,

    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: false,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,

    initialSorting,
    hiddenColumns: [],
    columnResizeMode: "onChange",

    persistenceKey: `kardex-report-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
    persistColumnSizing: true,
  });

  // ── Footer totals ─────────────────────────────────────────────────────────

  const totals = useMemo(
    () => ({
      cantidad: data.reduce(
        (sum, item) => sum + parseFloat(item.cantidad.toString()),
        0
      ),
      entradaTotal: data.reduce(
        (sum, item) => sum + parseFloat(item.entrada_total.toString()),
        0
      ),
      salidaTotal: data.reduce(
        (sum, item) => sum + parseFloat(item.salida_total.toString()),
        0
      ),
      saldoFinal:
        data.length > 0
          ? parseFloat(data[data.length - 1].saldo.toString())
          : 0,
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
                <div className="text-xs text-muted-foreground">Cant. total</div>
                <div className="text-xs font-bold">
                  {formatNumber(totals.cantidad, 0)}
                </div>
              </TableCell>
            );
          }

          if (id === "entrada_total") {
            return (
              <TableCell
                key={id}
                className="p-2 text-right"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total entradas
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end">
                  <ArrowDown className="size-3 inline mr-1" />
                  {formatCurrency(totals.entradaTotal)}
                </div>
              </TableCell>
            );
          }

          if (id === "salida_total") {
            return (
              <TableCell
                key={id}
                className="p-2 text-right"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">
                  Total salidas
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-end">
                  <ArrowUp className="size-3 inline mr-1" />
                  {formatCurrency(totals.salidaTotal)}
                </div>
              </TableCell>
            );
          }

          if (id === "saldo") {
            return (
              <TableCell
                key={id}
                className="p-2 text-right mr-2"
                style={{ width: column.getSize() }}
              >
                <div className="text-xs text-muted-foreground">Saldo final</div>
                <div className="text-sm font-bold">
                  {formatNumber(totals.saldoFinal, 0)}
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <VirtualizedCustomizableTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      errorMessage="Error al cargar el reporte"
      noDataMessage="No hay movimientos para mostrar"
      noDataDescription="Selecciona un producto o intenta ampliar el rango de fechas, también verifica que el producto seleccionado tenga movimientos registrados."
      tableRef={tableRef}
      enableColumnReordering={true}
      // enableSorting={true}
      stickyHeader={true}
      rows={rows}
      renderTableFooter={renderTotalsRow}
    />
  );
}
