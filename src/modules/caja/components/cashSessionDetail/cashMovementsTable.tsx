import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import CustomizableTable from "@/components/common/CustomizableTable";
import { useCustomTable } from "@/hooks/useCustomTable";
import { cn } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Undo2 } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ANULABLE_CONCEPTS, type CashMovement } from "../../types/cashMovement.types";

interface CashMovementsTableProps {
  data: CashMovement[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  canAnular?: boolean;
  onAnular?: (movement: CashMovement) => void;
}

const formatDateSafe = (dateString: string): string => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return dateString;
  }
};

const REFERENCIA_ROUTES: Partial<Record<string, (nro: string, id: number) => string>> = {
  almacen_out:     (_nro, id) => `/dashboard/sales/${id}`,
  almacen_out_dev: (_nro, id) => `/dashboard/returns/${id}`,
  almacen_in:      (_nro, id) => `/dashboard/purchases/${id}`,
  almacen_quo:     (_nro, id) => `/dashboard/quotations/${id}`,
};

export const CashMovementsTable: React.FC<CashMovementsTableProps> = ({
  data,
  isLoading,
  isFetching,
  isError,
  canAnular = false,
  onAnular,
}) => {
  const navigate = useNavigate();

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
        size: 150,
        cell: ({ row }) => {
          const { referencia_tipo, referencia_id, referencia_nro } = row.original;
          if (!referencia_tipo || referencia_id == null) return <span className="text-muted-foreground">—</span>;

          const display = referencia_nro ?? `#${referencia_id}`;
          const routeFn = referencia_tipo ? REFERENCIA_ROUTES[referencia_tipo] : undefined;
          const path = routeFn ? routeFn(referencia_nro ?? String(referencia_id), referencia_id) : null;

          if (path) {
            return (
              <button
                type="button"
                onClick={() => navigate(path)}
                className="text-sm font-medium text-primary underline-offset-2 hover:underline cursor-pointer"
              >
                {display}
              </button>
            );
          }

          return <span className="text-sm text-muted-foreground">{display}</span>;
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
      ...(canAnular && onAnular
        ? [{
            id: "acciones",
            header: "",
            size: 80,
            enableHiding: false,
            cell: ({ row }: { row: { original: CashMovement } }) => {
              const m = row.original;
              const esAnulable = ANULABLE_CONCEPTS.includes(m.concepto);
              const yaAnulado = m.referencia_tipo === 'caja_movimientos';
              if (!esAnulable || yaAnulado) return null;
              return (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                  onClick={() => onAnular(m)}
                >
                  <Undo2 className="size-3.5" />
                  <span className="sr-only">Anular</span>
                </Button>
              );
            },
          } satisfies ColumnDef<CashMovement>]
        : []),
    ],
    [canAnular, onAnular]
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
