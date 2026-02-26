import { useMemo, useRef } from "react";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import type { ReportItem } from "../../types/report.types";
import { cn } from "@/lib/utils";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { Award } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { TableCell, TableRow } from "@/components/atoms/table";
import VirtualizedCustomizableTable from "@/components/common/VirtualizedCustomizableTable";
import { formatCurrency } from "@/utils/formaters";

interface ReportTableProps {
  data: ReportItem[];
  showRanking?: boolean;
  highlightTotalColumn?: boolean;
  highlightQuantityColumn?: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  initialSorting?: SortingState;
  reportType?: "XIngreso" | "XCantidad";
  rows?: number;
  isError?: boolean;
  showRowNumbers?: boolean;
}

const formatNumber = (value: string | number, decimals: number = 2): string => {
  const num = typeof value === "string" ? parseFloat(value.toString()) : value;
  return num.toLocaleString("es-BO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export function SaleReportTable({
  data,
  showRanking = true,
  highlightTotalColumn = false,
  highlightQuantityColumn = false,
  isLoading = false,
  isFetching = false,
  initialSorting,
  reportType,
  rows,
  isError = false,
  showRowNumbers = false,
}: ReportTableProps) {
  const user = authSDK.getCurrentUser();
  const tableRef = useRef<HTMLTableElement>(null);

  const getRankingBadge = (rank: number) => {
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

  const columns = useMemo<ColumnDef<ReportItem>[]>(
    () => [
      ...(showRanking || showRowNumbers
        ? [
            {
              id: "ranking",
              header: "# Ranking",
              cell: ({ row }: any) => (
                <div className="w-20">
                  {showRanking && !showRowNumbers ? (
                    getRankingBadge(row.index + 1)
                  ) : (
                    <span className="font-medium px-2">{row.index + 1}°</span>
                  )}
                </div>
              ),
              enableSorting: false,
              size: 100,
              minSize: 100,
            },
          ]
        : []),
      {
        accessorKey: "codigo",
        header: "Código",
        cell: ({ getValue }: any) => (
          <span className="text-xs">{getValue()}</span>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "producto",
        header: "Producto",
        cell: ({ getValue }: any) => (
          <div className="flex">
            <span className="text-sm line-clamp-2 truncate" title={getValue()}>
              {getValue()}
            </span>
          </div>
        ),
        size: 350,
        minSize: 200,
      },
      {
        accessorKey: "sucursal",
        header: "Sucursal",
        cell: ({ getValue }: any) => (
          <Badge variant="outline" className="text-xs">
            {getValue()}
          </Badge>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "cantidad",
        header: "Cantidad",
        cell: ({ getValue }: any) => (
          <div
            className={cn(
              "text-right",
              (reportType === "XCantidad" || highlightQuantityColumn) &&
                "font-semibold text-blue-600 dark:text-blue-400"
            )}
          >
            {formatNumber(getValue(), 0)}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "precio_medio",
        header: "Precio Medio",
        cell: ({ getValue }: any) => (
          <div className="text-right text-sm">{formatCurrency(getValue())}</div>
        ),
        size: 130,
        minSize: 110,
      },
      {
        accessorKey: "subtotal",
        header: "Subtotal",
        cell: ({ getValue }: any) => (
          <div
            className={cn(
              "text-right text-sm",
              reportType === "XIngreso" &&
                "font-semibold text-blue-600 dark:text-blue-400"
            )}
          >
            {formatCurrency(getValue())}
          </div>
        ),
        size: 130,
        minSize: 110,
      },
      {
        accessorKey: "subtotal_descuento",
        header: "Descuento",
        cell: ({ getValue }: any) => {
          const value = parseFloat(getValue().toString());
          return (
            <div className="text-right text-sm text-red-600 dark:text-red-400">
              {value > 0 ? `-${formatCurrency(value)}` : "-"}
            </div>
          );
        },
        size: 130,
        minSize: 110,
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ getValue }: any) => (
          <div
            className={cn(
              "text-right font-semibold text-sm",
              highlightTotalColumn && "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {formatCurrency(getValue())}
          </div>
        ),
        size: 140,
        minSize: 120,
      },
    ],
    [showRanking, highlightTotalColumn]
  );

  const { table } = useCustomTable({
    data,
    columns,

    // Configuración de características
    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: false,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,

    // Sorting inicial
    initialSorting: initialSorting,

    // Columnas ocultas por defecto (ninguna)
    hiddenColumns: [],

    // Configuración de resize
    columnResizeMode: "onChange",

    // Persistencia con key única por usuario
    persistenceKey: `report-mas-vendido-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
    persistColumnSizing: true,
  });

  const totals = useMemo(
    () => ({
      cantidad: data.reduce(
        (sum, item) => sum + parseFloat(item.cantidad.toString()),
        0
      ),
      subtotal: data.reduce(
        (sum, item) => sum + parseFloat(item.subtotal.toString()),
        0
      ),
      descuento: data.reduce(
        (sum, item) => sum + parseFloat(item.subtotal_descuento.toString()),
        0
      ),
      total: data.reduce(
        (sum, item) => sum + parseFloat(item.total.toString()),
        0
      ),
    }),
    [data]
  );

  // Renderizar fila de totales
  const renderTotalsRow = () => {
    const visibleColumns = table.getVisibleLeafColumns();

    return (
      <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
        {visibleColumns.map((column) => {
          const columnId = column.id;

          // Columna de cantidad - mostrar total
          if (columnId === "cantidad") {
            return (
              <TableCell
                key={columnId}
                className="p-1 text-end"
                style={{ width: column.getSize() }}
              >
                <div className="text-sm text-muted-foreground">Cantidad</div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {totals.cantidad}
                </div>
              </TableCell>
            );
          }

          // Columna de subtotal - mostrar total
          if (columnId === "subtotal") {
            return (
              <TableCell
                key={columnId}
                className="p-1 text-end"
                style={{ width: column.getSize() }}
              >
                <div className="text-sm text-muted-foreground">Subtotal</div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totals.subtotal)}
                </div>
              </TableCell>
            );
          }

          if (columnId === "subtotal_descuento") {
            return (
              <TableCell
                key={columnId}
                className="p-1 text-end"
                style={{ width: column.getSize() }}
              >
                <div className="text-sm text-muted-foreground">Descuento</div>
                <div className="text-sm font-bold text-red-600 dark:text-red-400">
                  -{formatCurrency(totals.descuento)}
                </div>
              </TableCell>
            );
          }

          if (columnId === "total") {
            return (
              <TableCell
                key={columnId}
                className="p-1 text-end"
                style={{ width: column.getSize() }}
              >
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totals.total)}
                </div>
              </TableCell>
            );
          }

          // Resto de columnas vacías
          return (
            <TableCell
              key={columnId}
              className="p-1"
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
      errorMessage={"Error al cargar el reporte"}
      noDataMessage="No hay datos para mostrar"
      tableRef={tableRef}
      enableColumnReordering={true}
      enableSorting={false}
      stickyHeader={true}
      rows={rows}
      renderTableFooter={renderTotalsRow}
      // renderBottomRow={
      //   <tr className="bg-muted/90 backdrop-blur-sm font-semibold">
      //     {showRanking && <td className="p-2" />}
      //     <td className="p-2 text-base" colSpan={3}>
      //       TOTALES ({data.length} productos)
      //     </td>
      //     <td className="p-2 text-right text-blue-600 text-base">
      //       {formatNumber(totals.cantidad, 0)}
      //     </td>
      //     <td className="p-2" />
      //     <td className="p-2 text-right text-base">
      //       {formatCurrency(totals.subtotal)}
      //     </td>
      //     <td className="p-2 text-right text-red-600 text-base">
      //       {totals.descuento > 0
      //         ? `-${formatCurrency(totals.descuento)}`
      //         : "-"}
      //     </td>
      //     <td
      //       className={cn(
      //         "p-2 text-right text-base",
      //         highlightTotalColumn && "text-green-600"
      //       )}
      //     >
      //       {formatCurrency(totals.total)}
      //     </td>
      //   </tr>
      // }
    />
  );
}
