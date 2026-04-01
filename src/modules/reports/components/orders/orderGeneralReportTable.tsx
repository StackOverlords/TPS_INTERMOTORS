import { useMemo, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { Badge } from "@/components/atoms/badge";
import { TableCell, TableRow } from "@/components/atoms/table";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import { formatCurrency } from "@/utils/formaters";
import type { OrderReportGeneralItem } from "../../types/orderReport.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderGeneralReportTableProps {
  data: OrderReportGeneralItem[];
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

// Badges para estado_pedido
const ESTADO_CONFIG: Record<
  string,
  {
    label: string;
    variant:
      | "default"
      | "success"
      | "warning"
      | "accent"
      | "info"
      | "secondary"
      | "outline"
      | "danger";
  }
> = {
  D: { label: "Recibido", variant: "success" },
  T: { label: "En tránsito", variant: "info" },
  P: { label: "Pendiente", variant: "warning" },
  A: { label: "Anulado", variant: "danger" },
};

const getEstadoBadge = (estado: string) => {
  const cfg = ESTADO_CONFIG[estado] ?? {
    label: estado,
    variant: "outline" as const,
  };
  return (
    <Badge
      variant={cfg.variant}
      className="text-[10px] px-1.5 py-0 whitespace-nowrap"
    >
      {cfg.label}
    </Badge>
  );
};

// Badge tipo_pedido
const TIPO_PEDIDO_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  MY: { label: "Mayor", variant: "secondary" },
  ME: { label: "Menor", variant: "outline" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderGeneralReportTable({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
  showRowNumbers = false,
}: OrderGeneralReportTableProps) {
  const user = authSDK.getCurrentUser();
  const tableRef = useRef<HTMLTableElement>(null);

  const columns = useMemo<ColumnDef<OrderReportGeneralItem>[]>(
    () => [
      ...(showRowNumbers
        ? [
            {
              id: "ranking",
              header: "#",
              cell: ({ row }) => (
                <span className="font-medium px-2 text-muted-foreground">
                  {row.index + 1}
                </span>
              ),
              enableSorting: false,
              size: 50,
              minSize: 50,
            } satisfies ColumnDef<OrderReportGeneralItem>,
          ]
        : []),

      {
        accessorKey: "nro",
        header: "N° Pedido",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {getValue<number>()}
          </span>
        ),
        size: 70,
        minSize: 50,
      },

      {
        accessorKey: "fecha_pedido",
        header: "Fecha Pedido",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {getValue<string>()}
          </span>
        ),
        size: 100,
        minSize: 50,
      },

      {
        accessorKey: "fecha_llegada",
        header: "Fecha Llegada",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {getValue<string | null>() ?? (
              <span className="text-muted-foreground/50 italic">—</span>
            )}
          </span>
        ),
        size: 100,
        minSize: 50,
      },

      {
        accessorKey: "estado_pedido",
        header: "Estado",
        cell: ({ getValue }) => getEstadoBadge(getValue<string>()),
        size: 110,
        minSize: 90,
      },

      {
        accessorKey: "proveedor",
        header: "Proveedor",
        cell: ({ getValue }) => (
          <span
            className="text-xs font-medium line-clamp-1 block max-w-[200px]"
            title={getValue<string>()}
          >
            {getValue<string>()}
          </span>
        ),
        size: 220,
        minSize: 150,
      },

      {
        accessorKey: "codigo",
        header: "Código",
        cell: ({ getValue }) => (
          <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
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
        accessorKey: "marca",
        header: "Marca",
        cell: ({ getValue }) => (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 whitespace-nowrap"
          >
            {getValue<string>()}
          </Badge>
        ),
        size: 100,
        minSize: 80,
      },

      {
        accessorKey: "tipo_pedido",
        header: "Tipo",
        cell: ({ getValue }) => {
          const cfg = TIPO_PEDIDO_CONFIG[getValue<string>()] ?? {
            label: getValue<string>(),
            variant: "outline" as const,
          };
          return (
            <Badge variant={cfg.variant} className="text-[10px] px-1.5 py-0">
              {cfg.label}
            </Badge>
          );
        },
        size: 80,
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
        accessorKey: "costo",
        header: "Costo Unit.",
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
          <div className="text-right text-xs font-bold tabular-nums text-violet-600 dark:text-violet-400 mr-2">
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
    persistenceKey: `order-general-report-table-${user?.name}`,
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
                <div className="text-xs text-muted-foreground">Total Cant.</div>
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
                <div className="text-xs font-bold text-violet-600 dark:text-violet-400">
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
      errorMessage="Error al cargar el reporte de pedidos"
      noDataMessage="No hay pedidos registrados"
      noDataDescription="Ajusta el rango de fechas o la sucursal seleccionada."
      tableRef={tableRef}
      enableColumnReordering={true}
      stickyHeader={true}
      rows={data.length}
      renderTableFooter={renderTotalsRow}
    />
  );
}
