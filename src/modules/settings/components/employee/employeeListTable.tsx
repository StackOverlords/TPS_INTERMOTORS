import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import authSDK from "@/services/sdk-simple-auth";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, RotateCcw, Trash2, Users } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import EmployeeFormDialog from "./employeeFormDialog";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";
import type { Employee } from "../../types/employee.types";
import { ColumnVisibilityDropdown } from "@/components/common/ColumnVisibilityDropdown";
import { showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useRestoreEmployee } from "../../hooks/employee/useRestoreEmployee";
import ConfirmationModal from "@/components/common/confirmationModal";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import EmployeeDetailModal from "./employeeDetailModal";
import { useTabEffect } from "@/hooks/tabs/useTabEffect";

interface EmployeeListTableProps {
  employees: Employee[];
  handleOpenDeleteAlert: (vars?: number | undefined) => void;
  isLoadingEmployeesData: boolean;
  isErrorEmployeesData: boolean;
  isFetchingEmployeesData: boolean;
  rows: number | undefined;
  page: number;
  totalRecords: number;
  handleRowsChange: (rows: number) => void;
  onPageChange: (page: number) => void;
}

const hasValue = (v: string | null | undefined): v is string =>
  v != null && v.trim() !== "";

const EmptyCell = () => (
  <span className="text-muted-foreground/40 text-xs select-none">—</span>
);

const cellText = (active: boolean) =>
  active ? "text-foreground" : "text-muted-foreground italic";

const SCREEN_PATH = "/dashboard/settings/responsibles";

const EmployeeListTable: React.FC<EmployeeListTableProps> = ({
  employees,
  handleOpenDeleteAlert,
  isErrorEmployeesData,
  isFetchingEmployeesData,
  isLoadingEmployeesData,
  rows,
  page,
  totalRecords,
  handleRowsChange,
  onPageChange,
}) => {
  const user = authSDK.getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const { handleError } = useErrorHandler();
  const { mutate: restoreEmployee } = useRestoreEmployee();

  const handleRestoreSuccess = useCallback((_data: unknown, id: number) => {
    showSuccessToast({
      title: "Responsable activado",
      description: `El Responsable #${id} fue reactivado exitosamente`,
      duration: 5000,
    });
  }, []);

  const handleRestoreError = useCallback(
    (error: unknown, id: number) => {
      handleError({
        error,
        customTitle: `Error al reactivar el Responsable #${id}`,
      });
    },
    [handleError]
  );

  const {
    close: handleCloseRestoreAlert,
    confirm: handleConfirmRestoreAlert,
    isOpen: showRestoreAlert,
    open: handleOpenRestoreAlert,
    variables: itemToRestore,
  } = useConfirmMutation(
    restoreEmployee,
    handleRestoreSuccess,
    handleRestoreError
  );

  useTabEffect(SCREEN_PATH, () => {
    if (location.state?.openModal) {
      handleAddEmployee();
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleAddEmployee = useCallback(() => {
    setEditingId(null);
    setIsFormOpen(true);
  }, []);

  const handleEditEmployee = useCallback((id: number) => {
    setEditingId(id);
    setIsFormOpen(true);
  }, []);

  const handleViewDetail = useCallback((id: number) => {
    setDetailId(id);
    setIsDetailOpen(true);
  }, []);

  const handleFormToggle = useCallback((open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingId(null);
  }, []);

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 50,
        minSize: 40,
        cell: ({ getValue, row }) => (
          <span
            className={`font-medium font-mono text-xs ${cellText(row.original.activo)}`}
          >
            #{getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: ({ getValue, row }) => (
          <span
            className={`font-medium truncate block ${cellText(row.original.activo)}`}
          >
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "apellido",
        header: "Apellido Paterno",
        cell: ({ getValue, row }) => {
          const v = getValue<string | null | undefined>();
          return hasValue(v) ? (
            <span className={cellText(row.original.activo)}>{v}</span>
          ) : (
            <EmptyCell />
          );
        },
      },
      {
        accessorKey: "apellido_m",
        header: "Apellido Materno",
        cell: ({ getValue, row }) => {
          const v = getValue<string | null | undefined>();
          return hasValue(v) ? (
            <span className={cellText(row.original.activo)}>{v}</span>
          ) : (
            <EmptyCell />
          );
        },
      },
      {
        accessorKey: "direccion",
        header: "Dirección",
        size: 200,
        minSize: 150,
        cell: ({ getValue, row }) => {
          const v = getValue<string | null | undefined>();
          return hasValue(v) ? (
            <span
              className={`truncate block max-w-[180px] ${cellText(row.original.activo)}`}
            >
              {v}
            </span>
          ) : (
            <EmptyCell />
          );
        },
      },
      {
        accessorKey: "responsable_ventas",
        header: "Resp. Ventas",
        size: 120,
        minSize: 100,
        cell: ({ getValue, row }) => {
          const v = getValue<boolean | null>();
          if (!row.original.activo)
            return (
              <Badge variant={v ? "success" : "outline"} className="opacity-50">
                {v ? "Sí" : "No"}
              </Badge>
            );
          return v ? (
            <Badge variant="success">Sí</Badge>
          ) : (
            <Badge variant="outline">No</Badge>
          );
        },
      },
      {
        accessorKey: "responsable_compras",
        header: "Resp. Compras",
        size: 120,
        minSize: 100,
        cell: ({ getValue, row }) => {
          const v = getValue<boolean | null>();
          if (!row.original.activo)
            return (
              <Badge variant={v ? "success" : "outline"} className="opacity-50">
                {v ? "Sí" : "No"}
              </Badge>
            );
          return v ? (
            <Badge variant="success">Sí</Badge>
          ) : (
            <Badge variant="outline">No</Badge>
          );
        },
      },
      {
        accessorKey: "activo",
        header: "Estado",
        size: 100,
        minSize: 80,
        cell: ({ getValue }) => {
          const isActive = getValue<boolean>();
          return (
            <Badge variant={isActive ? "success" : "danger"}>
              {isActive ? "Activo" : "Inactivo"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        size: 120,
        minSize: 110,
        cell: ({ row }) => {
          const { id, activo } = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <Button
                className="w-8"
                variant="outline"
                onClick={() => handleViewDetail(id)}
                title="Ver detalles"
              >
                <Eye className="size-4" />
              </Button>

              <Button
                className="w-8"
                variant="outline"
                onClick={() => handleEditEmployee(id)}
                title="Editar"
              >
                <Edit className="size-4" />
              </Button>

              {activo ? (
                <Button
                  className="w-8 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 bg-transparent hover:border-red-200 dark:hover:border-red-600"
                  variant="outline"
                  onClick={() => handleOpenDeleteAlert(id)}
                  title="Desactivar"
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : (
                <Button
                  className="w-8"
                  variant="outline"
                  onClick={() => handleOpenRestoreAlert(id)}
                  title="Reactivar"
                >
                  <RotateCcw className="size-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [
      handleEditEmployee,
      handleViewDetail,
      handleOpenDeleteAlert,
      handleOpenRestoreAlert,
    ]
  );

  const { table } = useCustomTable({
    data: employees,
    columns,
    enableSorting: false,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,
    columnResizeMode: "onChange",
    persistenceKey: `employees-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const { selectedIndex, setSelectedIndex, isFocused } = useKeyboardNavigation<
    Employee,
    HTMLTableElement
  >({
    items: employees,
    containerRef: tableRef,
    isDragging: isDraggingColumn,
    onPrimaryAction: (employee: Employee) => handleEditEmployee(employee.id),
    getItemId: (employee) => employee.id,
  });

  const handleDragStart = useCallback(() => setIsDraggingColumn(true), []);
  const handleDragEnd = useCallback(() => setIsDraggingColumn(false), []);

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 flex-shrink-0">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-primary">
              <Users className="size-5" />
              Gestionar Responsables
            </CardTitle>
            <CardDescription className="text-sm">
              {totalRecords} elemento{totalRecords !== 1 ? "s" : ""} registrado
              {totalRecords !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown table={table} />
            <EmployeeFormDialog
              isOpen={isFormOpen}
              onOpenChange={handleFormToggle}
              isEditing={isEditing}
              editingId={editingId}
            />
          </div>
        </CardHeader>

        <CardContent className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <div className="h-full overflow-auto">
              <CustomizableTable
                table={table}
                isLoading={isLoadingEmployeesData}
                isError={isErrorEmployeesData}
                isFetching={isFetchingEmployeesData}
                rows={rows}
                errorMessage="Ocurrió un error al cargar los responsables."
                noDataMessage="No se encontraron responsables."
                selectedRowIndex={selectedIndex}
                onRowClick={(index) => setSelectedIndex(index)}
                tableRef={tableRef}
                focused={isFocused}
                keyboardNavigationEnabled={true}
                enableColumnReordering={true}
                enableSorting={false}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
              />
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-border bg-background">
            <Pagination
              className="border-0 px-0 pt-2 pb-0"
              currentPage={page}
              onPageChange={onPageChange}
              totalData={totalRecords}
              onShowRowsChange={handleRowsChange}
              showRows={rows}
            />
          </div>
        </CardContent>
      </Card>

      <EmployeeDetailModal
        employeeId={detailId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <ConfirmationModal
        isOpen={showRestoreAlert}
        variant="success"
        title="Reactivar Responsable"
        message={`¿Deseas reactivar al Responsable #${itemToRestore}?`}
        alertMessage="El responsable volverá a estar disponible en el sistema."
        confirmText="Sí, reactivar"
        onClose={handleCloseRestoreAlert}
        onConfirm={handleConfirmRestoreAlert}
      />
    </>
  );
};

export default EmployeeListTable;
