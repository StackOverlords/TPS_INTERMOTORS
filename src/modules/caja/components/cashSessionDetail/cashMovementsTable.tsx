import { Badge } from "@/components/atoms/badge";
import CustomizableTable from "@/components/common/CustomizableTable";
import { useCustomTable } from "@/hooks/useCustomTable";
import { cn } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import type { CashMovement } from "../../types/cashMovement.types";

interface CashMovementsTableProps {
  data: CashMovement[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

const formatDateSafe = (dateString: string): string => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return dateString;
  }
};

export const CashMovementsTable: React.FC<CashMovementsTableProps> = ({
  data,
  isLoading,
  isFetching,
  isError,
}) => {
  const columns = useMemo<ColumnDef<CashMovement>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Nro",
        size: 80,
        enableHiding: false,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-medium">
            #{getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: "tipo_movimiento",
        header: "Tipo",
        size: 110,
        cell: ({ row }) => {
          const tipo = row.original.tipo_movimiento;
          return (
            <Badge variant={tipo === "INGRESO" ? "success" : "destructive"}>
              {tipo}
            </Badge>
          );
        },
      },
      {
        accessorKey: "concepto_label",
        header: "Concepto",
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "origen",
        header: "Origen",
        size: 130,
        cell: ({ row }) => {
          const origen = row.original.origen;
          return (
            <Badge variant={origen === "AUTOMATICO" ? "default" : "secondary"}>
              {origen === "AUTOMATICO" ? "Automático" : "Manual"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "forma_pago_label",
        header: "Forma de Pago",
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "monto",
        header: "Monto",
        size: 120,
        cell: ({ row }) => {
          const { monto, tipo_movimiento } = row.original;
          return (
            <div
              className={cn("text-right text-sm font-medium", {
                "text-emerald-600 dark:text-emerald-400":
                  tipo_movimiento === "INGRESO",
                "text-destructive": tipo_movimiento === "EGRESO",
              })}
            >
              Bs {monto.toFixed(2)}
            </div>
          );
        },
      },
      {
        id: "referencia",
        header: "Referencia",
        size: 140,
        cell: ({ row }) => {
          const { referencia_tipo, referencia_id } = row.original;
          return (
            <span className="text-sm text-muted-foreground">
              {referencia_tipo && referencia_id != null
                ? `${referencia_tipo} #${referencia_id}`
                : "—"}
            </span>
          );
        },
      },
      {
        id: "tipo_gasto",
        header: "Tipo Gasto",
        size: 140,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.tipo_gasto?.nombre ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "descripcion",
        header: "Descripción",
        size: 200,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground truncate block max-w-[200px]">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "fecha_reg",
        header: "Fecha",
        size: 150,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateSafe(getValue<string>())}
          </span>
        ),
      },
    ],
    []
  );

  const { table } = useCustomTable({
    data,
    columns,
    enableSorting: false,
    enableColumnResizing: true,
    enableRowSelection: false,
    enableColumnVisibility: true,
    enableColumnOrdering: false,
    enablePagination: false,
    columnResizeMode: "onChange",
    persistenceKey: "cash-movements-table",
    persistColumnVisibility: true,
  });

  return (
    <section className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-auto">
        <CustomizableTable
          table={table}
          isError={isError}
          isFetching={isFetching}
          isLoading={isLoading}
          errorMessage="Ocurrió un error al cargar los movimientos"
          noDataMessage="No se encontraron movimientos para esta sesión"
        />
      </div>
    </section>
  );
};

export default CashMovementsTable;
