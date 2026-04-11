import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import CustomizableTable from "@/components/common/CustomizableTable";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useCustomTable } from "@/hooks/useCustomTable";
import { formatCurrency } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCheck, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { AlertBadge } from "./AlertBadge";
import type { Alert } from "../types/alert";
import useMarkAlertRead from "../hooks/mutations/useMarkAlertRead";

interface AlertListProps {
    alerts: Alert[];
    isLoading: boolean;
    isError: boolean;
    tipo_documento: "CxP" | "CxC";
    onMarkAllRead?: () => void;
    isMarkingAll?: boolean;
}

/**
 * Componente presentacional de lista de alertas.
 * Regla visual: dias_restantes < 0 → rojo (VENCIDA), >= 0 → amarillo (PROXIMA)
 */
export const AlertList = ({
    alerts,
    isLoading,
    isError,
    tipo_documento,
    onMarkAllRead,
    isMarkingAll,
}: AlertListProps) => {
    const { mutate: markRead, isPending: isMarkingOne } = useMarkAlertRead();

    const handleMarkRead = (alert: Alert) => {
        markRead(
            { id: alert.id, tipo_documento },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: "Alerta marcada como leída",
                        description: `La alerta #${alert.id} fue marcada como leída`,
                    });
                },
                onError: (error) => {
                    showErrorToast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Error desconocido",
                    });
                },
            }
        );
    };

    const columns = useMemo<ColumnDef<Alert>[]>(
        () => [
            {
                id: "estado_alerta",
                header: "Estado",
                size: 130,
                minSize: 100,
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <AlertBadge alert={row.original} />
                    </div>
                ),
            },
            {
                id: "contraparte_nombre",
                accessorFn: (row) => row.contraparte.nombre,
                header: tipo_documento === "CxP" ? "Proveedor" : "Cliente",
                size: 200,
                minSize: 100,
                cell: ({ getValue }) => (
                    <div className="font-medium">{getValue<string>()}</div>
                ),
            },
            {
                id: "documento_nro",
                accessorFn: (row) => row.documento.nro,
                header: tipo_documento === "CxP" ? "Nro. Compra" : "Nro. Venta",
                size: 130,
                minSize: 80,
                cell: ({ getValue }) => (
                    <div className="text-center font-mono font-medium">#{getValue<string>()}</div>
                ),
            },
            {
                accessorKey: "plazo_pago",
                header: "Plazo de Pago",
                size: 130,
                minSize: 80,
                cell: ({ getValue }) => {
                    const plazo = getValue<string | null>();
                    return (
                        <div className="text-center">
                            {plazo ? new Date(plazo).toLocaleDateString("es-ES") : "-"}
                        </div>
                    );
                },
            },
            {
                accessorKey: "dias_restantes",
                header: "Días Restantes",
                size: 120,
                minSize: 80,
                cell: ({ getValue }) => {
                    const dias = getValue<number>();
                    return (
                        <div
                            className={`text-center font-semibold text-sm ${
                                dias < 0 ? "text-destructive" : "text-yellow-600 dark:text-yellow-400"
                            }`}
                        >
                            {dias < 0 ? `Vencida (${Math.abs(dias)}d)` : `${dias} días`}
                        </div>
                    );
                },
            },
            {
                accessorKey: "saldo_pendiente",
                header: "Saldo Pendiente",
                size: 140,
                minSize: 100,
                cell: ({ getValue }) => (
                    <div className="text-right font-semibold text-destructive">
                        {formatCurrency(getValue<number>())}
                    </div>
                ),
            },
            {
                accessorKey: "estado",
                header: "Estado Lectura",
                size: 120,
                minSize: 80,
                cell: ({ getValue }) => {
                    const estado = getValue<string>();
                    return (
                        <div className="flex justify-center">
                            <Badge
                                variant={estado === "LEIDA" ? "success" : "outline"}
                                className="text-xs"
                            >
                                {estado === "LEIDA" ? "Leída" : "No leída"}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                id: "actions",
                header: "Acciones",
                size: 120,
                minSize: 80,
                cell: ({ row }) => {
                    const isLeida = row.original.estado === "LEIDA";
                    return (
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={isLeida || isMarkingOne}
                                onClick={() => handleMarkRead(row.original)}
                                title={isLeida ? "Ya marcada como leída" : "Marcar como leída"}
                            >
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Marcar leída
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [tipo_documento, isMarkingOne]
    );

    const { table } = useCustomTable({
        data: alerts,
        columns,
        enableSorting: true,
        enableColumnResizing: true,
        enableRowSelection: false,
        enableColumnVisibility: true,
        enableColumnOrdering: true,
        enablePagination: true,
        columnResizeMode: "onChange",
        initialPageSize: 20,
        persistenceKey: `alerts-list-${tipo_documento}`,
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    return (
        <div className="flex flex-col h-full space-y-2">
            {/* Header con mark-all */}
            <div className="flex items-center justify-between px-1">
                <span className="text-sm text-muted-foreground">
                    {alerts.length} alerta{alerts.length !== 1 ? "s" : ""}
                </span>
                {onMarkAllRead && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={isMarkingAll || alerts.length === 0}
                        onClick={onMarkAllRead}
                    >
                        {isMarkingAll ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                            <CheckCheck className="h-3 w-3 mr-1" />
                        )}
                        Marcar todas leídas
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-border">
                <CustomizableTable
                    table={table}
                    isLoading={isLoading}
                    isError={isError}
                    noDataMessage="No hay alertas"
                    errorMessage="Error al cargar las alertas"
                    enableColumnReordering={true}
                    enableSorting={true}
                />
            </div>
        </div>
    );
};
