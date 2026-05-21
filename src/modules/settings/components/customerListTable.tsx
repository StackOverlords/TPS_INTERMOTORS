import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Checkbox } from "@/components/atoms/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";
import authSDK from "@/services/sdk-simple-auth";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Settings, Trash2, Users } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Customer } from "../types/customer.types";
import CustomerFormDialog from "./customerFormDialog";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { useTabEffect } from "@/hooks/tabs/useTabEffect";

interface CustomerListTableProps {
  customers: Customer[];
  handleOpenDeleteAlert: (vars?: number | undefined) => void;
  isLoadingCustomersData: boolean;
  isErrorCustomersData: boolean;
  isFetchingCustomersData: boolean;
  rows: number | undefined;
  page: number;
  totalRecords: number;
  handleRowsChange: (rows: number) => void;
  onPageChange: (page: number) => void;
}
const SCREEN_PATH = "/dashboard/settings/customers";
const CustomerListTable: React.FC<CustomerListTableProps> = ({
  customers,
  handleOpenDeleteAlert,
  isErrorCustomersData,
  isFetchingCustomersData,
  isLoadingCustomersData,
  rows,
  page,
  totalRecords,
  handleRowsChange,
  onPageChange,
}) => {
  const user = authSDK.getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  useTabEffect(SCREEN_PATH, () => {
    if (location.state?.openModal) {
      handleAddCustomer();
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleAddCustomer = useCallback(() => {
    setEditingId(null);
    setIsDialogOpen(true);
  }, []);

  // Protected

  const handleEditCustomer = useCallback((id: number) => {
    // alert("Editar cliente ID: " + id);
    setEditingId(id);
    setIsDialogOpen(true);
  }, []);

  // const protectedCreate = useProtectedAction(handleAddCustomer, {
  //     permission: PERMISSIONS.CLI.CREATE,
  //     roles: ["Super Admin", "Administrador", "Vendedor"]
  // });

  // Versión protegida para Enter / doble click en filas
  const protectedEditCustomer = useProtectedAction(
    (customer: Customer) => {
      handleEditCustomer(customer.id);
    },
    {
      permission: PERMISSIONS.CLI.EDIT,
      roles: ["Super Admin", "Administrador", "Vendedor"],
    }
  );

  const handleDialogToggle = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingId(null);
    }
  }, []);

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 40,
        minSize: 30,
        cell: ({ getValue }) => (
          <span className="font-medium font-mono ">#{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: ({ getValue }) => (
          <h3 className="font-medium  truncate">{getValue<string>()}</h3>
        ),
      },
      {
        accessorKey: "nit",
        header: "NIT",
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return (
            <span className="text-sm ">
              {value || <span className=" italic">Sin NIT</span>}
            </span>
          );
        },
      },
      {
        accessorKey: "contacto",
        header: "Contacto",
        size: 150,
        minSize: 120,
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return (
            <span className="text-sm ">
              {value || <span className=" italic">Sin contacto</span>}
            </span>
          );
        },
      },
      {
        accessorKey: "direccion",
        header: "Dirección",
        size: 200,
        minSize: 150,
        cell: ({ getValue }) => {
          const direccion = getValue<string | null>();
          return (
            <span className="text-sm  truncate">
              {direccion || <span className=" italic">Sin dirección</span>}
            </span>
          );
        },
      },
      {
        accessorKey: "codigo_interno",
        header: "Código Interno",
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm ">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: "dias_plazo",
        header: "Días Plazo",
        size: 100,
        minSize: 80,
        cell: ({ getValue }) => (
          <span className="text-sm ">{getValue<number>()} días</span>
        ),
      },
      {
        accessorKey: "pais",
        header: "País",
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => {
          const pais = getValue<string>();
          return (
            <span className="text-sm ">
              {pais || <span className=" italic">Sin país</span>}
            </span>
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
            <Badge variant={isActive ? "success" : "secondary"}>
              {isActive ? "Activo" : "Inactivo"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        size: 80,
        minSize: 80,
        cell: ({ row }) => {
          const id = row.original.id;
          return (
            <div className="flex items-center gap-2">
              <ProtectedAction
                permission={PERMISSIONS.CLI.EDIT}
                roles={["Super Admin", "Administrador", "Vendedor"]}
                fallback={null}
              >
                <Button
                  className="w-8 cursor-pointer"
                  variant={"outline"}
                  onClick={() => handleEditCustomer(id)}
                >
                  <Edit className="size-4" />
                </Button>
              </ProtectedAction>

              <ProtectedAction
                permission={PERMISSIONS.CLI.DELETE}
                roles={["Super Admin", "Administrador", "Vendedor"]}
                fallback={null}
              >
                <Button
                  className="w-8 cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 bg-transparent hover:border-red-200 dark:hover:border-red-600"
                  variant={"outline"}
                  onClick={() => handleOpenDeleteAlert(id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </ProtectedAction>
            </div>
          );
        },
      },
    ],
    [handleEditCustomer, handleOpenDeleteAlert]
  );

  const { table } = useCustomTable({
    data: customers,
    columns,

    // Configuración de características
    enableSorting: false,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,

    // Configuración de resize
    columnResizeMode: "onChange",

    // Persistencia con key única por usuario
    persistenceKey: `customers-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const {
    selectedIndex,
    setSelectedIndex,
    isFocused,
    // hotkeys
  } = useKeyboardNavigation<Customer, HTMLTableElement>({
    items: customers,
    containerRef: tableRef,
    isDragging: isDraggingColumn,
    onPrimaryAction: protectedEditCustomer,
    getItemId: (customer) => customer.id,
  });
  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleDragStart = useCallback(() => {
    setIsDraggingColumn(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDraggingColumn(false);
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 flex-shrink-0">
        <div>
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-primary">
            <Users className="size-5 " />
            Gestionar Clientes
          </CardTitle>
          <CardDescription className="text-sm">
            {totalRecords} elemento{totalRecords !== 1 ? "s" : ""} registrado
            {totalRecords !== 1 ? "s" : ""}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 max-h-96 overflow-y-auto border border-border"
            >
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuItem
                    key={column.id}
                    className="flex items-center space-x-2 cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                    onClick={() =>
                      column.toggleVisibility(!column.getIsVisible())
                    }
                  >
                    <Checkbox
                      className="border border-border"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    />
                    <span className="flex-1">
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                    </span>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <CustomerFormDialog
            isOpen={isDialogOpen}
            onOpenChange={handleDialogToggle}
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
              isLoading={isLoadingCustomersData}
              isError={isErrorCustomersData}
              isFetching={isFetchingCustomersData}
              rows={rows}
              errorMessage="Ocurrió un error al cargar los clientes."
              noDataMessage="No se encontraron clientes."
              selectedRowIndex={selectedIndex}
              onRowClick={handleRowClick}
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

        {/* Pagination - FIJO en la parte inferior */}
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
  );
};
export default CustomerListTable;
