import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/atoms/alert-dialog";
import CustomizableTable from "@/components/common/CustomizableTable";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useCustomTable } from "@/hooks/useCustomTable";
import { formatCurrency } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import useDeleteCxPPayment from "../../hooks/mutations/useDeleteCxPPayment";
import useCxPPayments from "../../hooks/queries/useCxPPayments";
import type { CxPPayment } from "../../schemas/cxpPayment.schema";
import { CreateCxPPaymentForm } from "./CreateCxPPaymentForm";

interface CxPPaymentsListProps {
    id_compra: number;
    proveedor_id: number;
    saldoPendiente: number;
    onPaymentChange?: () => void;
}

export const CxPPaymentsList = ({ id_compra, proveedor_id, saldoPendiente, onPaymentChange }: CxPPaymentsListProps) => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<CxPPayment | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const { data: paymentsData, isLoading, refetch } = useCxPPayments(id_compra);
    const { mutate: deletePayment, isPending: isDeleting } = useDeleteCxPPayment();

    const payments = useMemo(() => paymentsData?.data || [], [paymentsData]);

    const openDeleteDialog = (payment: CxPPayment) => {
        setPaymentToDelete(payment);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        if (!paymentToDelete) return;

        deletePayment(
            { id_pago: paymentToDelete.id, id_compra },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: "Pago eliminado",
                        description: `El pago #${paymentToDelete.nro_pago} se eliminó exitosamente`,
                    });
                    refetch();
                    onPaymentChange?.();
                    setShowDeleteDialog(false);
                    setPaymentToDelete(null);
                },
                onError: (error) => {
                    showErrorToast({
                        title: "Error al eliminar pago",
                        description: error instanceof Error ? error.message : "Error desconocido",
                    });
                    setShowDeleteDialog(false);
                    setPaymentToDelete(null);
                },
            }
        );
    };

    const handleCancelDelete = () => {
        setShowDeleteDialog(false);
        setPaymentToDelete(null);
    };

    const columns = useMemo<ColumnDef<CxPPayment>[]>(
        () => [
            {
                accessorKey: "nro_pago",
                header: "Nro. Pago",
                size: 100,
                minSize: 30,
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
                    <div className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
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
                        <div className="text-sm text-muted-foreground truncate">
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
                            onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(row.original);
                            }}
                            disabled={isDeleting}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Eliminar pago"
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
        persistenceKey: "cxp-payments-table",
        persistColumnVisibility: true,
        persistColumnOrder: true,
        persistPageSize: true,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-4 border border-border rounded-lg bg-card">
            {/* Header */}
            <div className="flex items-center justify-between p-1">
                <div>
                    <h3 className="text-lg font-semibold">Lista de Pagos</h3>
                    <p className="text-sm text-muted-foreground">
                        Total de pagos registrados: {payments.length}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {saldoPendiente > 0 ? (
                        <Badge variant="destructive" className="text-sm">
                            Saldo pendiente: {formatCurrency(saldoPendiente)}
                        </Badge>
                    ) : saldoPendiente === 0 ? (
                        <Badge variant="success" className="text-sm">
                            ✓ Pagado completamente
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-sm border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30">
                            Saldo a favor: {formatCurrency(Math.abs(saldoPendiente))}
                        </Badge>
                    )}
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        size="sm"
                        disabled={saldoPendiente <= 0}
                        title={saldoPendiente <= 0 ? "No hay saldo pendiente para pagar" : "Crear nuevo pago"}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {showCreateForm ? "Cancelar" : "Nuevo Pago"}
                    </Button>
                </div>
            </div>

            {/* Formulario */}
            {showCreateForm && (
                <CreateCxPPaymentForm
                    id_compra={id_compra}
                    proveedor_id={proveedor_id}
                    saldoMaximo={saldoPendiente}
                    onSuccess={() => {
                        setShowCreateForm(false);
                        refetch();
                        onPaymentChange?.();
                    }}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            {/* Tabla */}
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

            {/* Diálogo eliminación */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {paymentToDelete && (
                                <>
                                    ¿Está seguro de que desea eliminar el pago{" "}
                                    <strong>#{paymentToDelete.nro_pago}</strong> por un monto de{" "}
                                    <strong>{formatCurrency(paymentToDelete.monto)}</strong>?
                                    <br /><br />
                                    Esta acción no se puede deshacer y el saldo pendiente se actualizará automáticamente.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelDelete} disabled={isDeleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 focus:ring-destructive"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                "Eliminar pago"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
