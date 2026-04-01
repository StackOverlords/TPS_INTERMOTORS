import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import ConfirmationModal from "@/components/common/confirmationModal";
import CustomizableTable from "@/components/common/CustomizableTable";
import TooltipButton from "@/components/common/TooltipButton";
import { showErrorToast } from "@/hooks/use-toast-enhanced";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ExpenseTypeModal } from "../components/modals/ExpenseTypeModal";
import { useDeleteExpenseType } from "../hooks/useDeleteExpenseType";
import { useExpenseTypes } from "../hooks/useExpenseTypes";
import type { ExpenseType } from "../types/expenseType.types";

const ExpenseTypesScreen = () => {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branchId = Number(selectedBranchId);
  const user = authSDK.getCurrentUser();

  const [modal, setModal] = useState<{
    open: boolean;
    expenseType: ExpenseType | null;
  }>({ open: false, expenseType: null });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: number | null;
  }>({ open: false, id: null });

  const { data, isLoading, isError, isFetching } = useExpenseTypes();
  const { mutate: deleteExpenseType, isPending: isDeleting } =
    useDeleteExpenseType();

  const handleDelete = () => {
    if (!deleteConfirm.id) return;
    const id = deleteConfirm.id;
    deleteExpenseType(id, {
      onSuccess: () => {
        setDeleteConfirm({ open: false, id: null });
      },
      onError: (error: unknown) => {
        const err = error as { status?: number; message?: string };
        if (err?.status === 422) {
          showErrorToast({
            title: "No se puede eliminar",
            description:
              "Este tipo de gasto tiene movimientos asociados y no puede eliminarse.",
          });
        } else {
          showErrorToast({
            title: "Error al eliminar",
            description:
              err?.message ?? "Ocurrió un error al eliminar el tipo de gasto.",
          });
        }
        setDeleteConfirm({ open: false, id: null });
      },
    });
  };

  const columns = useMemo<ColumnDef<ExpenseType>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 60,
        minSize: 40,
        cell: ({ getValue }) => (
          <span className="font-medium font-mono">#{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: ({ getValue }) => (
          <span className="font-medium truncate">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "descripcion",
        header: "Descripción",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground truncate">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "activo",
        header: "Estado",
        size: 100,
        cell: ({ getValue }) => {
          const activo = getValue<boolean>();
          return (
            <Badge variant={activo ? "success" : "secondary"}>
              {activo ? "Activo" : "Inactivo"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        size: 100,
        cell: ({ row }) => {
          const expenseType = row.original;
          return (
            <div className="flex items-center gap-2">
              <TooltipButton
                tooltip="Editar tipo de gasto"
                onClick={() => setModal({ open: true, expenseType })}
                buttonProps={{ className: "w-8" }}
              >
                <Pencil className="size-4" />
              </TooltipButton>
              <TooltipButton
                tooltip="Eliminar tipo de gasto"
                onClick={() =>
                  setDeleteConfirm({ open: true, id: expenseType.id })
                }
                buttonProps={{
                  className:
                    "w-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 bg-transparent hover:border-red-200 dark:hover:border-red-600",
                }}
              >
                <Trash2 className="size-4" />
              </TooltipButton>
            </div>
          );
        },
      },
    ],
    []
  );

  const { table } = useCustomTable({
    data: data ?? [],
    columns,
    enableSorting: false,
    enableColumnResizing: true,
    enableRowSelection: false,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,
    columnResizeMode: "onChange",
    persistenceKey: `expense-types-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-lg font-bold text-primary">Tipos de Gasto</h1>
          <Button
            onClick={() => setModal({ open: true, expenseType: null })}
            size="sm"
          >
            <Plus className="size-4" />
            Nuevo Tipo de Gasto
          </Button>
        </div>

        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <CustomizableTable
            table={table}
            isLoading={isLoading}
            isError={isError}
            isFetching={isFetching}
            rows={data?.length ?? 0}
            errorMessage="Ocurrió un error al cargar los tipos de gasto."
            noDataMessage="No se encontraron tipos de gasto."
            enableColumnReordering={true}
            enableSorting={false}
          />
        </div>
      </div>

      <ExpenseTypeModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, expenseType: null })}
        branchId={branchId}
        expenseType={modal.expenseType ?? undefined}
      />

      <ConfirmationModal
        isOpen={deleteConfirm.open}
        title="Eliminar Tipo de Gasto"
        message="¿Estás seguro? Esta acción no se puede deshacer. Si el tipo tiene movimientos asociados, el servidor rechazará la eliminación."
        variant="danger"
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </main>
  );
};

export default ExpenseTypesScreen;
