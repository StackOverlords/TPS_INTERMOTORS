import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import CustomizableTable from "@/components/common/CustomizableTable";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useCustomTable } from "@/hooks/useCustomTable";
import { formatCurrency } from "@/utils/formaters";
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
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import useCreditNotes from "../../hooks/queries/useCreditNotes";
import type { CreditNote } from "../../schemas/creditNote.schema";
import { CreateCreditNoteForm } from "./CreateCreditNoteForm";

interface CreditNotesListProps {
    id_compra: number;
    proveedor_id: number;
    saldoPendiente: number;
    onCreditNoteChange?: () => void;
}

export const CreditNotesList = ({ id_compra, proveedor_id, saldoPendiente, onCreditNoteChange }: CreditNotesListProps) => {
    const [showCreateForm, setShowCreateForm] = useState(false);

    const { data: creditNotesData, isLoading, refetch } = useCreditNotes(id_compra);

    const creditNotes = useMemo(() => creditNotesData?.data || [], [creditNotesData]);

    const columns = useMemo<ColumnDef<CreditNote>[]>(
        () => [
            {
                accessorKey: "id",
                header: "ID",
                size: 70,
                minSize: 50,
                cell: ({ getValue }) => (
                    <div className="text-center font-medium text-muted-foreground">#{getValue<number>()}</div>
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
                accessorKey: "monto",
                header: "Monto",
                size: 130,
                minSize: 80,
                cell: ({ getValue }) => (
                    <div className="text-right font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(getValue<number>())}
                    </div>
                ),
            },
            {
                accessorKey: "comentarios",
                header: "Comentarios",
                size: 250,
                minSize: 80,
                cell: ({ getValue }) => {
                    const comentarios = getValue<string | null>();
                    return (
                        <div className="text-sm text-muted-foreground truncate">
                            {comentarios || "-"}
                        </div>
                    );
                },
            },
        ],
        []
    );

    const { table } = useCustomTable({
        data: creditNotes,
        columns,
        enableSorting: true,
        enableColumnResizing: true,
        enableRowSelection: false,
        enableColumnVisibility: true,
        enableColumnOrdering: true,
        enablePagination: true,
        columnResizeMode: "onChange",
        initialPageSize: 10,
        persistenceKey: "cxp-credit-notes-table",
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
                    <h3 className="text-lg font-semibold">Notas de Crédito</h3>
                    <p className="text-sm text-muted-foreground">
                        Total registradas: {creditNotes.length}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {saldoPendiente > 0 ? (
                        <Badge variant="destructive" className="text-sm">
                            Saldo pendiente: {formatCurrency(saldoPendiente)}
                        </Badge>
                    ) : (
                        <Badge variant="success" className="text-sm">
                            ✓ Saldado
                        </Badge>
                    )}
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        size="sm"
                        disabled={saldoPendiente <= 0}
                        title={saldoPendiente <= 0 ? "No hay saldo pendiente" : "Crear nota de crédito"}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {showCreateForm ? "Cancelar" : "Nueva Nota"}
                    </Button>
                </div>
            </div>

            {/* Formulario */}
            {showCreateForm && (
                <CreateCreditNoteForm
                    id_compra={id_compra}
                    proveedor_id={proveedor_id}
                    saldoMaximo={saldoPendiente}
                    onSuccess={() => {
                        setShowCreateForm(false);
                        refetch();
                        onCreditNoteChange?.();
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
                    noDataMessage="No hay notas de crédito registradas"
                    enableColumnReordering={true}
                    enableSorting={true}
                />
            </div>
        </div>
    );
};
