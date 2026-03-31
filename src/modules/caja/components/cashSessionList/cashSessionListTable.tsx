import { Badge } from "@/components/atoms/badge";
import CustomizableTable from "@/components/common/CustomizableTable";
import TooltipButton from "@/components/common/TooltipButton";
import { useCustomTable } from "@/hooks/useCustomTable";
import { formatCurrency } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, Lock } from "lucide-react";
import { useMemo } from "react";
import type { CashSession } from "../../types/cashSession.types";
import { cn } from "@/lib/utils";

interface CashSessionListTableProps {
  data: CashSession[] | [];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onViewDetail: (id: number) => void;
  onClose: (session: CashSession) => void;
}

const formatDateSafe = (dateString: string | null): string => {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return dateString;
  }
};

export const CashSessionListTable: React.FC<CashSessionListTableProps> = ({
  data,
  isLoading,
  isFetching,
  isError,
  onViewDetail,
  onClose,
}) => {
  const columns = useMemo<ColumnDef<CashSession>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Nro",
        size: 80,
        enableHiding: false,
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-medium">#{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        size: 110,
        cell: ({ row }) => (
          <Badge variant={row.original.estado === "ABIERTA" ? "success" : "secondary"}>
            {row.original.estado_label}
          </Badge>
        ),
      },
      {
        accessorKey: "sucursal",
        header: "Sucursal",
        size: 160,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.sucursal.nombre}</span>
        ),
      },
      {
        id: "apertura",
        header: "Apertura",
        size: 200,
        cell: ({ row }) => (
          <div className="space-y-0.5 flex flex-col">
            <span className="font-medium text-sm text-foreground">
              {row.original.usuario_apertura.nombre}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateSafe(row.original.fecha_apertura)}
            </span>
          </div>
        ),
      },
      {
        id: "cierre",
        header: "Cierre",
        size: 200,
        cell: ({ row }) => {
          const userCierre = row.original.usuario_cierre;
          const fechaCierre = row.original.fecha_cierre;
          return (
            <div className="space-y-0.5 flex flex-col">
              <span
                className={cn(
                  "font-medium text-sm",
                  userCierre ? "text-foreground" : "italic text-muted-foreground"
                )}
              >
                {userCierre?.nombre ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateSafe(fechaCierre)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "monto_apertura",
        header: "Monto Apertura",
        size: 140,
        cell: ({ getValue }) => (
          <div className="text-right font-medium text-sm">
            {formatCurrency(getValue<number>())}
          </div>
        ),
      },
      {
        accessorKey: "saldo_sistema",
        header: "Saldo Sistema",
        size: 140,
        cell: ({ getValue }) => (
          <div className="text-right font-medium text-sm text-emerald-600 dark:text-emerald-400">
            {formatCurrency(getValue<number>())}
          </div>
        ),
      },
      {
        accessorKey: "diferencia",
        header: "Diferencia",
        size: 120,
        cell: ({ getValue }) => {
          const diferencia = getValue<number | null>();
          if (diferencia === null || diferencia === undefined) {
            return <span className="text-muted-foreground text-sm text-right block">—</span>;
          }
          return (
            <div
              className={cn("text-right text-sm font-medium", {
                "text-destructive": diferencia < 0,
                "text-emerald-600 dark:text-emerald-400": diferencia > 0,
                "text-muted-foreground": diferencia === 0,
              })}
            >
              Bs {diferencia.toFixed(2)}
            </div>
          );
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        size: 100,
        enableHiding: false,
        cell: ({ row }) => {
          const session = row.original;
          const isClosed = session.estado === "CERRADA";
          return (
            <div className="flex items-center gap-1">
              <TooltipButton
                tooltip="Ver Detalle"
                onClick={() => onViewDetail(session.id)}
                buttonProps={{ size: "sm", className: "h-7 w-7 p-0" }}
              >
                <Eye className="size-4" />
              </TooltipButton>
              <TooltipButton
                tooltip="Cerrar Sesión"
                onClick={() => onClose(session)}
                buttonProps={{
                  size: "sm",
                  className: "h-7 w-7 p-0",
                  disabled: isClosed,
                }}
              >
                <Lock className="size-4" />
              </TooltipButton>
            </div>
          );
        },
      },
    ],
    [onViewDetail, onClose]
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
    persistenceKey: "cash-sessions-table",
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
          errorMessage="Ocurrió un error al cargar las sesiones de caja"
          noDataMessage="No se encontraron sesiones de caja"
        />
      </div>
    </section>
  );
};

export default CashSessionListTable;
