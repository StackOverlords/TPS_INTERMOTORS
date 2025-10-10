import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Checkbox } from "@/components/atoms/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/atoms/dropdown-menu";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import authSDK from "@/services/sdk-simple-auth";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef, type VisibilityState } from "@tanstack/react-table";
import { Edit, Settings, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Customer } from "../types/customer.types";
import CustomerFormDialog from "./customerFormDialog";

const getColumnVisibilityKey = (userName: string) => `customers-columns-${userName}`;

interface CustomerListTableProps {
    customers: Customer[]
    handleOpenDeleteAlert: (vars?: number | undefined) => void
    isLoadingCustomersData: boolean
    isErrorCustomersData: boolean
    isFetchingCustomersData: boolean
    rows: number | undefined
    page: number
    totalRecords: number
    handleRowsChange: (rows: number) => void
    onPageChange: (page: number) => void
}

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
    onPageChange
}) => {
    const user = authSDK.getCurrentUser()
    const navigate = useNavigate();
    const location = useLocation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const isEditing = useMemo(() => editingId !== null, [editingId]);

    useEffect(() => {
        if (location.state?.openModal) {
            handleAddCustomer()
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    const handleAddCustomer = useCallback(() => {
        setEditingId(null);
        setIsDialogOpen(true);
    }, []);

    const handleEditCustomer = useCallback((id: number) => {
        setEditingId(id);
        setIsDialogOpen(true);
    }, []);

    const handleDialogToggle = useCallback((open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingId(null);
        }
    }, []);

    useEffect(() => {
        if (!user?.name) return;
        const COLUMN_VISIBILITY_KEY = getColumnVisibilityKey(user.name);
        const savedVisibility = localStorage.getItem(COLUMN_VISIBILITY_KEY);
        if (savedVisibility) {
            try {
                const parsed = JSON.parse(savedVisibility);
                setColumnVisibility(parsed);
            } catch (error) {
                console.error('Error parsing column visibility:', error);
                localStorage.removeItem(COLUMN_VISIBILITY_KEY);
            }
        }
    }, [user?.name]);

    useEffect(() => {
        if (!user?.name || Object.keys(columnVisibility).length === 0) return;
        const COLUMN_VISIBILITY_KEY = getColumnVisibilityKey(user.name);
        try {
            localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
        } catch (error) {
            console.error('Error saving column visibility:', error);
        }
    }, [columnVisibility, user?.name]);

    const columns = useMemo<ColumnDef<Customer>[]>(() => [
        {
            accessorKey: "id",
            header: "ID",
            size: 40,
            minSize: 30,
            cell: ({ getValue }) => (
                <span className="font-medium font-mono text-gray-700">
                    #{getValue<number>()}
                </span>
            )
        },
        {
            accessorKey: "nombre",
            header: "Nombre",
            cell: ({ getValue }) => (
                <h3 className="font-medium text-gray-700 truncate">
                    {getValue<string>()}
                </h3>
            )
        },
        {
            accessorKey: "nit",
            header: "NIT",
            size: 120,
            minSize: 100,
            cell: ({ getValue }) => {
                const value = getValue<string | null>();
                return (
                    <span className="text-sm text-gray-600">
                        {value || <span className="text-gray-400 italic">Sin NIT</span>}
                    </span>
                )
            }
        },
        {
            accessorKey: "contacto",
            header: "Contacto",
            size: 150,
            minSize: 120,
            cell: ({ getValue }) => {
                const value = getValue<string | null>();
                return (
                    <span className="text-sm text-gray-600">
                        {value || <span className="text-gray-400 italic">Sin contacto</span>}
                    </span>
                )
            }
        },
        {
            accessorKey: "direccion",
            header: "Dirección",
            size: 200,
            minSize: 150,
            cell: ({ getValue }) => {
                const direccion = getValue<string | null>();
                return (
                    <span className="text-sm text-gray-600 truncate">
                        {direccion || <span className="text-gray-400 italic">Sin dirección</span>}
                    </span>
                )
            }
        },
        {
            accessorKey: "codigo_interno",
            header: "Código Interno",
            size: 120,
            minSize: 100,
            cell: ({ getValue }) => (
                <span className="font-mono text-sm text-gray-600">
                    {getValue<number>()}
                </span>
            )
        },
        {
            accessorKey: "dias_plazo",
            header: "Días Plazo",
            size: 100,
            minSize: 80,
            cell: ({ getValue }) => (
                <span className="text-sm text-gray-600">
                    {getValue<number>()} días
                </span>
            )
        },
        {
            accessorKey: "pais",
            header: "País",
            size: 120,
            minSize: 100,
            cell: ({ getValue }) => {
                const pais = getValue<string>();
                return (
                    <span className="text-sm text-gray-600">
                        {pais || <span className="text-gray-400 italic">Sin país</span>}
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
                const isActive = getValue<boolean>();
                return (
                    <Badge variant={isActive ? "success" : "secondary"}>
                        {isActive ? "Activo" : "Inactivo"}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            header: "Acciones",
            size: 80,
            minSize: 80,
            cell: ({ row }) => {
                const id = row.original.id
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            className="w-8 cursor-pointer"
                            variant={"outline"}
                            onClick={() => handleEditCustomer(id)}
                        >
                            <Edit className="size-4" />
                        </Button>

                        <Button
                            className="w-8 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:border-red-200"
                            variant={"outline"}
                            onClick={() => handleOpenDeleteAlert(id)}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                )
            },
        },
    ], [handleEditCustomer, handleOpenDeleteAlert]);

    const table = useReactTable<Customer>({
        data: customers,
        columns,
        state: {
            columnVisibility
        },
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: "onChange",
        enableColumnResizing: true,
        enableRowSelection: false,
    })

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                        <Users className="size-5 text-gray-700" />
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
                        <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto border border-gray-200">
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
                    <CustomerFormDialog
                        isOpen={isDialogOpen}
                        onOpenChange={handleDialogToggle}
                        isEditing={isEditing}
                        editingId={editingId}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg border-gray-200">
                    <CustomizableTable
                        table={table}
                        isLoading={isLoadingCustomersData}
                        isError={isErrorCustomersData}
                        isFetching={isFetchingCustomersData}
                        rows={rows}
                    />
                </div>

                <Pagination
                    className="border-0 px-0 pt-3 pb-0"
                    currentPage={page}
                    onPageChange={onPageChange}
                    totalData={totalRecords}
                    onShowRowsChange={handleRowsChange}
                    showRows={rows}
                />
            </CardContent>
        </Card>
    );
}
export default CustomerListTable;
