import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import CustomizableTable from "@/components/common/CustomizableTable";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useCustomTable } from "@/hooks/useCustomTable";
import { formatCurrency } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useDeletePayment } from "../../hooks/mutations/useDeletePayment";
import { usePayments } from "../../hooks/queries/usePayments";
import type { Payment } from "../../schemas/payment.schema";
import { CreatePaymentForm } from "./CreatePaymentForm";

interface PaymentsListProps {
    id_venta: number;
    saldoPendiente: number;
    onPaymentChange?: () => void;
}

export const PaymentsList = ({ id_venta, saldoPendiente, onPaymentChange }: PaymentsListProps) => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [paymentFilters, setPaymentFilters] = useState({
        id_venta,
        nro_pago: undefined,
        fecha_inicio: undefined,
        fecha_fin: undefined,
    });

    const { data: paymentsData, isLoading, refetch } = usePayments(paymentFilters);
    const { mutate: deletePayment, isPending: isDeleting } = useDeletePayment();

    const payments = useMemo(() => paymentsData?.data || [], [paymentsData]);

    const handleDeletePayment = (payment: Payment) => {
        if (!window.confirm(`¿Está seguro de eliminar el pago #${payment.nro_pago}?`)) {
            return;
        }

        deletePayment(
            { id_pago: payment.id, id_venta },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: "Pago eliminado",
                        description: `El pago #${payment.nro_pago} se eliminó exitosamente`,
                    });
                    refetch();
                    onPaymentChange?.();
                },
                onError: (error) => {
                    showErrorToast({
                        title: "Error al eliminar pago",
                        description: error instanceof Error ? error.message : "Error desconocido",
                    });
                },
            }
        );
    };

    const columns = useMemo<ColumnDef<Payment>[]>(
        () => [
            {
                accessorKey: "nro_pago",
                header: "Nro. Pago",
                size: 100,
                minSize:30,
                cell: ({ getValue }) => (
                    <div className="text-center font-medium">#{getValue<number>()}</div>
                ),
            },
            {
                accessorKey: "fecha",
                header: "Fecha",
                size: 120,
                minSize: 100,
                cell: ({ getValue }) => {
                    const date = getValue<string>();
                    return (
                        <div className="text-center">
                            {new Date(date).toLocaleDateString("es-ES")}
                        </div>
                    );
                },
            },
            {
                accessorKey: "tipo_pago",
                header: "Tipo de Pago",
                size: 100,
                minSize: 30,
                cell: ({ getValue }) => {
                    const tipo = getValue<string>();
                    const variant = tipo === "EFECTIVO" ? "default" : tipo === "CHEQUE" ? "secondary" : "outline";
                    return (
                        <div className="flex justify-center">
                            <Badge variant={variant}>{tipo}</Badge>
                        </div>
                    );
                },
            },
            {
                accessorKey: "monto",
                header: "Monto",
                size: 120,
                minSize: 30,
                cell: ({ getValue }) => (
                    <div className="text-right font-semibold text-green-600">
                        {formatCurrency(getValue<number>())}
                    </div>
                ),
            },
            {
                accessorKey: "comentarios",
                header: "Comentarios",
                size: 250,
                minSize: 30,
                cell: ({ getValue }) => {
                    const comentarios = getValue<string | null>();
                    return (
                        <div className="text-sm text-gray-600 truncate">
                            {comentarios || "-"}
                        </div>
                    );
                },
            },
            {
                id: "actions",
                header: "Acciones",
                size: 80,
                minSize: 30,
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePayment(row.original)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        [isDeleting]
    );

    const { table } = useCustomTable({
        data: payments,
        columns,
        enableSorting: true,
        enableColumnResizing: true,
        enableRowSelection: false,
        enableColumnVisibility: true,
        enableColumnOrdering: true,
        enablePagination: true,
        columnResizeMode: "onChange",
        initialPageSize: 10,
        persistenceKey: "accountPayable-payments-table",
        persistColumnVisibility: true,
        persistColumnOrder: true,
        persistPageSize: true,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-4 border border-border rounded-lg bg-card">
            {/* Header con botón para crear pago */}
            <div className="flex items-center justify-between p-1">
                <div>
                    <h3 className="text-lg font-semibold">Lista de Pagos</h3>
                    <p className="text-sm text-gray-500">
                        Total de pagos registrados: {payments.length}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {saldoPendiente > 0 && (
                        <Badge variant="destructive" className="text-sm">
                            Saldo pendiente: {formatCurrency(saldoPendiente)}
                        </Badge>
                    )}
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        size="sm"
                        disabled={saldoPendiente <= 0}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {showCreateForm ? "Cancelar" : "Nuevo Pago"}
                    </Button>
                </div>
            </div>

            {/* Formulario para crear pago */}
            {showCreateForm && (
                <CreatePaymentForm
                    id_venta={id_venta}
                    saldoMaximo={saldoPendiente}
                    onSuccess={() => {
                        setShowCreateForm(false);
                        refetch();
                        onPaymentChange?.();
                    }}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            {/* Tabla de pagos */}
            <div className="flex-1 overflow-auto rounded-lg">
                <CustomizableTable
                    table={table}
                    isLoading={isLoading}
                    isError={false}
                    noDataMessage="No hay pagos registrados"
                    enableColumnReordering={true}
                    enableSorting={true}
                />
            </div>
        </div>
    );
};
