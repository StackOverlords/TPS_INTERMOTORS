import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Checkbox } from "@/components/atoms/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/atoms/dropdown-menu";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import authSDK from "@/services/sdk-simple-auth";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, GitBranchIcon, Settings, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Branch } from "../types/branch.types";
import BranchFormDialog from "./branchFormDialog";
import { BranchUsersModal } from "./BranchUsersModal";

interface BranchListTableProps {
    branches: Branch[]
    handleOpenDeleteAlert: (vars?: number | undefined) => void
    isLoadingBranchesData: boolean
    isErrorBranchesData: boolean
    isFetchingBranchesData: boolean
    rows: number | undefined
    page: number
    totalRecords: number
    handleRowsChange: (rows: number) => void
    onPageChange: (page: number) => void
}

const BranchListTable: React.FC<BranchListTableProps> = ({
    branches,
    handleOpenDeleteAlert,
    isErrorBranchesData,
    isFetchingBranchesData,
    isLoadingBranchesData,
    rows,
    page,
    totalRecords,
    handleRowsChange,
    onPageChange
}) => {
    const user = authSDK.getCurrentUser()
    const navigate = useNavigate();
    const location = useLocation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [usersModalOpen, setUsersModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<{ id: number; name: string } | null>(null);
    const [isDraggingColumn, setIsDraggingColumn] = useState(false);
    const tableRef = useRef<HTMLTableElement>(null)

    const isEditing = useMemo(() => editingId !== null, [editingId]);

    useEffect(() => {
        if (location.state?.openModal) {
            handleAddBranch()
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    const handleAddBranch = useCallback(() => {
        setEditingId(null);
        setIsDialogOpen(true);
    }, []);

    const handleEditBranch = useCallback((id: number) => {
        setEditingId(id);
        setIsDialogOpen(true);
    }, []);

    // Versión protegida para doble click / Enter / atajos de teclado
    const protectedEditBranch = useProtectedAction(
        (branch: Branch) => {
            handleEditBranch(branch.id);
        },
        {
            permission: 'sis-adm_sucursales',
            roles: ['Super Admin', 'Administrador',"Vendedor"]
        }
    );

    const handleDialogToggle = useCallback((open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingId(null);
        }
    }, []);

    const handleOpenUsersModal = useCallback((id: number, name: string) => {
        setSelectedBranch({ id, name });
        setUsersModalOpen(true);
    }, []);

    const handleCloseUsersModal = useCallback(() => {
        setUsersModalOpen(false);
        setSelectedBranch(null);
    }, []);

    const columns = useMemo<ColumnDef<Branch>[]>(() => [
        {
            accessorKey: "id",
            header: "ID",
            size: 40,
            minSize: 30,
            cell: ({ getValue }) => (
                <span className="font-medium font-mono">
                    #{getValue<number>()}
                </span>
            )
        },
        {
            accessorKey: "nombre",
            header: "Nombre",
            cell: ({ getValue }) => (
                <h3 className="font-medium truncate">
                    {getValue<string>()}
                </h3>
            )
        },
        {
            accessorKey: "sigla",
            header: "Sigla",
            size: 80,
            minSize: 60,
            cell: ({ getValue }) => (
                <span className="font-mono text-sm font-semibold">
                    {getValue<string>()}
                </span>
            )
        },
        {
            accessorKey: "nombre_comercial",
            header: "Nombre Comercial",
            cell: ({ getValue }) => {
                const value = getValue<string | null>();
                return (
                    <span className="text-sm">
                        {value || <span className="text-gray-400 italic">Sin nombre comercial</span>}
                    </span>
                )
            }
        },
        {
            accessorKey: "activo",
            header: "Estado",
            size: 100,
            minSize: 80,
            cell: ({ getValue }) => {
                const isActive = getValue<string>() === "SI";
                return (
                    <Badge variant={isActive ? "success" : "secondary"}>
                        {isActive ? "Activo" : "Inactivo"}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "informacion_contacto",
            header: "Contacto",
            size: 200,
            minSize: 150,
            cell: ({ getValue }) => {
                const contactInfo = getValue<{
                    telefono: string | null;
                    celular: string | null;
                    direccion: string | null;
                }>();

                const hasContact = contactInfo?.telefono || contactInfo?.celular;

                return (
                    <div className="flex flex-col gap-1">
                        {contactInfo?.telefono && (
                            <span className="text-xs">
                                📞 {contactInfo.telefono}
                            </span>
                        )}
                        {contactInfo?.celular && (
                            <span className="text-xs">
                                📱 {contactInfo.celular}
                            </span>
                        )}
                        {!hasContact && (
                            <span className="text-xs text-gray-400 italic">Sin contacto</span>
                        )}
                    </div>
                )
            }
        },
        {
            id: "direccion",
            header: "Dirección",
            size: 200,
            minSize: 150,
            accessorFn: (row) => row.informacion_contacto?.direccion,
            cell: ({ getValue }) => {
                const direccion = getValue<string | null>();
                return (
                    <span className="text-sm truncate">
                        {direccion || <span className="text-gray-400 italic">Sin dirección</span>}
                    </span>
                )
            }
        },
        {
            id: "actions",
            header: "Acciones",
            size: 120,
            minSize: 120,
            cell: ({ row }) => {
                const id = row.original.id
                const nombre = row.original.nombre
                return (
                    <div className="flex items-center gap-2">
                        <ProtectedAction
                            permission="sis-adm_sucursales"
                            roles={["Super Admin", "Administrador","Vendedor"]}
                            fallback={null}
                        >
                            <Button
                                variant={"outline"}
                                onClick={() => handleEditBranch(id)}
                            >
                                <Edit className="size-4" />
                            </Button>
                        </ProtectedAction>

                        <ProtectedAction
                            permission="sis-adm_sucursales"
                            roles={["Super Admin", "Administrador","Vendedor"]}
                            fallback={null}
                        >
                            <Button
                                variant={"outline"}
                                onClick={() => handleOpenUsersModal(id, nombre)}
                            >
                                <Users className="size-4" />
                            </Button>
                        </ProtectedAction>

                        {/* <Button
                            className="w-8 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:border-red-200"
                            variant={"outline"}
                            onClick={() => handleOpenDeleteAlert(id)}
                        >
                            <Trash2 className="size-4" />
                        </Button> */}
                    </div>
                )
            },
        },
    ], [handleEditBranch, handleOpenDeleteAlert, handleOpenUsersModal]);

    const {
        table,
    } = useCustomTable({
        data: branches,
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
        persistenceKey: `branches-table-${user?.name}`,
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    const {
        selectedIndex,
        setSelectedIndex,
        isFocused,
        // hotkeys
    } = useKeyboardNavigation<Branch, HTMLTableElement>({
        items: branches,
        containerRef: tableRef,
        isDragging: isDraggingColumn,
        onPrimaryAction: protectedEditBranch, // Protegido con permisos
        getItemId: (branch) => branch.id
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
                        <GitBranchIcon className="size-5" />
                        Gestionar Sucursales
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
                        <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto border border-border">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuItem
                                        key={column.id}
                                        className="flex items-center space-x-2 cursor-pointer"
                                        onSelect={(e) => e.preventDefault()}
                                        onClick={() => column.toggleVisibility(!column.getIsVisible())}
                                    >
                                        <Checkbox
                                            className="border border-gray-400"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        />
                                        <span className="flex-1">
                                            {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <BranchFormDialog
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
                            isLoading={isLoadingBranchesData}
                            isError={isErrorBranchesData}
                            isFetching={isFetchingBranchesData}
                            rows={rows}
                            errorMessage="Ocurrió un error al cargar los sucursales."
                            noDataMessage="No se encontraron sucursales."
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
                <div className="flex-shrink-0 border-t border-border bg-card">
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

            {selectedBranch && (
                <BranchUsersModal
                    branchId={selectedBranch.id}
                    branchName={selectedBranch.name}
                    open={usersModalOpen}
                    onOpenChange={handleCloseUsersModal}
                />
            )}
        </Card>
    );
}
export default BranchListTable;
