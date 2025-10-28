import { type ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, CreateCategory, SubcategoryItem, UpdateCategory } from "../types/category.types";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { ChevronDown, ChevronRight, Edit, FolderOpen, Settings, Trash2 } from "lucide-react";
import CustomizableTable from "@/components/common/CustomizableTable";
import { cn } from "@/lib/utils";
import authSDK from "@/services/sdk-simple-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { ConfigFormDialog } from "./configFormDialog";
import Pagination from "@/components/common/pagination";
import type { DialogConfig } from "../types/configFormDialog.types";
import { useLocation, useNavigate } from "react-router";
import { useGetCategoryById } from "../hooks/category/useGetCategoryById";
import { useCreateCategory } from "../hooks/category/useCreateCategory";
import { useUpdateCategory } from "../hooks/category/useUpdateCategory";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateCategorySchema, UpdateCategorySchema } from "../schemas/category.schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/atoms/dropdown-menu";
import { Checkbox } from "@/components/atoms/checkbox";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";

const CATEGORIES_DIALOG_CONFIG: DialogConfig = {
    title: "Categoria",
    description: "una categoria",
    field: {
        name: "categoria",
        label: "Categoria",
        placeholder: "Ingresa el nombre de la categoria...",
        required: true,
    }
};

interface CategoryListTableProps {
    categories: Category[]
    handleOpenDeleteAlert: (vars?: number | undefined) => void
    isLoadingCategoriesData: boolean
    isErrorCategoriesData: boolean
    isFetchingCategoriesData: boolean
    rows: number | undefined
    page: number
    totalRecords: number
    handleRowsChange: (rows: number) => void
    onPageChange: (page: number) => void
}
const CategoryListTable: React.FC<CategoryListTableProps> = ({
    categories,
    handleOpenDeleteAlert,
    isErrorCategoriesData,
    isFetchingCategoriesData,
    isLoadingCategoriesData,
    rows,
    page,
    totalRecords,
    handleRowsChange,
    onPageChange
}) => {
    const user = authSDK.getCurrentUser()
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const navigate = useNavigate();
    const location = useLocation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isDraggingColumn, setIsDraggingColumn] = useState(false);
    const tableRef = useRef<HTMLTableElement>(null)

    const {
        data: categoryById,
        isLoading: isLoadingCategoryById,
        isError: isErrorCategoryById,
        error: errorCategoryById
    } = useGetCategoryById(editingId || 0)

    const {
        mutate: handleCreateCategory,
        isPending: isCreating
    } = useCreateCategory()

    const {
        mutate: handleUpdateCategory,
        isPending: isUpdating
    } = useUpdateCategory()

    const { handleError } = useErrorHandler()

    // Forms
    const createForm = useForm<CreateCategory>({
        resolver: zodResolver(CreateCategorySchema),
        defaultValues: {
            categoria: ''
        },
    });

    const updateForm = useForm<UpdateCategory>({
        resolver: zodResolver(UpdateCategorySchema),
        defaultValues: {
            categoria: ''
        },
    });

    const isEditing = useMemo(() => editingId !== null, [editingId]);
    const currentForm = useMemo(() => isEditing ? updateForm : createForm, [isEditing, updateForm, createForm]);
    const isSaving = useMemo(() => isCreating || isUpdating, [isCreating, isUpdating]);

    useEffect(() => {
        if (location.state?.openModal) {
            handleAddCategory()
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (categoryById && isEditing) {
            updateForm.reset({
                categoria: categoryById.categoria
            });
        }
    }, [categoryById, isEditing, updateForm]);

    const handleAddCategory = useCallback(() => {
        setEditingId(null);
        createForm.reset();
        setIsDialogOpen(true);
    }, [createForm]);

    const handleEditCategory = useCallback((id: number) => {
        setEditingId(id);
        setIsDialogOpen(true);
    }, []);

    const handleDialogToggle = useCallback((open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingId(null);
            createForm.reset();
            updateForm.reset();
        }
    }, [createForm, updateForm]);

    const handleCreateSubmit = useCallback(createForm.handleSubmit(async (data: CreateCategory) => {
        handleCreateCategory(data, {
            onSuccess: () => {
                showSuccessToast({
                    title: "Categoría Agregada",
                    description: "Categoría agregada exitosamente",
                    duration: 5000
                });
                handleDialogToggle(false);
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo agregar la categoría" });
            }
        });
    }), [createForm, handleCreateCategory, handleDialogToggle, handleError]);

    const handleUpdateSubmit = useCallback(updateForm.handleSubmit(async (data: UpdateCategory) => {
        if (!editingId) {
            showErrorToast({
                title: "Error al modificar categoría",
                description: "No se pudo modificar la categoría. Por favor, intenta nuevamente",
                duration: 5000
            });
            return;
        }

        handleUpdateCategory({ data, id: editingId }, {
            onSuccess: () => {
                showSuccessToast({
                    title: "Categoría Modificada",
                    description: "Categoría modificada exitosamente",
                    duration: 5000
                });
                handleDialogToggle(false);
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo modificar la categoría" });
            }
        });
    }), [updateForm, editingId, handleUpdateCategory, handleDialogToggle, handleError]);

    const toggleExpanded = useCallback((id: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const columns = useMemo<ColumnDef<Category>[]>(() => [
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
            accessorKey: "categoria",
            header: "Categoría",
            cell: ({ getValue }) => (
                <h3 className="font-medium text-gray-700 truncate">
                    {getValue<string>()}
                </h3>
            )
        },
        {
            accessorFn: row => row.subcategorias,
            id: "subcategorias",
            header: "Subcategorías",
            size: 450,
            minSize: 350,
            cell: ({ row, getValue }) => {
                const subcategories = getValue<SubcategoryItem[]>();
                const isExpanded = expandedRows.has(row.original.id);
                const hasSubcategories = subcategories && subcategories.length > 0;
                const totalItems = subcategories.length;

                const previewLimit = 3;
                const hasMore = totalItems > previewLimit;

                return (
                    <div className="py-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            {hasSubcategories && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 cursor-pointer"
                                    onClick={() => toggleExpanded(row.original.id)}
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </Button>
                            )}

                            <Badge
                                variant="accent"
                                className="hover:bg-purple-200 font-normal cursor-pointer"
                                onClick={() => hasSubcategories && toggleExpanded(row.original.id)}
                            >
                                {totalItems} subcategorías
                            </Badge>

                            {/* Vista previa cuando está colapsado */}
                            {!isExpanded && hasSubcategories && (
                                <>
                                    <span className="text-muted-foreground">•</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {subcategories.slice(0, previewLimit).map((sub, index) => (
                                            <span key={sub.id} className="text-xs text-muted-foreground">
                                                {sub.subcategoria}{index < Math.min(previewLimit - 1, totalItems - 1) && ','}
                                            </span>
                                        ))}
                                        {hasMore && (
                                            <span className="text-xs font-medium text-purple-600">
                                                +{totalItems - previewLimit} más
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Lista completa expandida con scroll */}
                        {isExpanded && hasSubcategories && (
                            <div className="mt-3 ml-9 border-l-2 border-purple-100 pl-3">
                                <div className={cn(
                                    "space-y-1",
                                    totalItems > 6 && "max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent"
                                )}>
                                    {subcategories.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="flex items-center gap-2 py-1 hover:bg-purple-50 rounded px-2 transition-colors"
                                        >
                                            <span className="font-mono text-xs text-purple-600">#{sub.id}</span>
                                            <span className="text-sm text-foreground">{sub.subcategoria}</span>
                                        </div>
                                    ))}
                                </div>
                                {totalItems > 6 && (
                                    <div className="mt-2 text-xs text-muted-foreground italic">
                                        Desplaza para ver todas las subcategorías
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            },
            sortingFn: (rowA, rowB) => {
                const a = rowA.original.subcategorias?.length || 0;
                const b = rowB.original.subcategorias?.length || 0;
                return a - b;
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
                            onClick={() => handleEditCategory(id)}
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
    ], [handleEditCategory, handleOpenDeleteAlert, expandedRows, toggleExpanded]);

    const {
        table,
    } = useCustomTable({
        data: categories,
        columns,

        // Configuración de características
        enableSorting: false,
        enableColumnResizing: true,
        enableRowSelection: true,
        enableColumnVisibility: true,
        enableColumnOrdering: true,
        enablePagination: false,

        // Columnas ocultas por defecto
        hiddenColumns: ['subcategorias'],

        // Configuración de resize
        columnResizeMode: "onChange",

        // Persistencia con key única por usuario
        persistenceKey: `categories-table-${user?.name}`,
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    const {
        selectedIndex,
        setSelectedIndex,
        isFocused,
        // hotkeys
    } = useKeyboardNavigation<Category, HTMLTableElement>({
        items: categories,
        containerRef: tableRef,
        isDragging: isDraggingColumn,
        onPrimaryAction: (category) => {
            handleEditCategory(category.id)
        },
        getItemId: (category) => category.id
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

    useEffect(() => {
        if (!isErrorCategoryById) return
        handleError({ error: errorCategoryById, customTitle: "Ocurrió un error al cargar los datos" });
        handleDialogToggle(false)
    }, [isErrorCategoryById, errorCategoryById, handleError, handleDialogToggle])

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 flex-shrink-0">
                <div>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                        <FolderOpen className="size-5 text-gray-700" />
                        Gestionar Categorías
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
                    <ConfigFormDialog
                        config={CATEGORIES_DIALOG_CONFIG}
                        isOpen={isDialogOpen}
                        onOpenChange={handleDialogToggle}
                        onSubmit={isEditing ? handleUpdateSubmit : handleCreateSubmit}
                        register={currentForm.register}
                        errors={currentForm.formState.errors}
                        isLoading={isLoadingCategoryById}
                        isEditing={isEditing}
                        editingId={editingId}
                        isSaving={isSaving}
                    />
                </div>
            </CardHeader>
            <CardContent className="h-full flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0">
                    <div className="h-full overflow-auto">
                        <CustomizableTable
                            table={table}
                            isLoading={isLoadingCategoriesData}
                            isError={isErrorCategoriesData}
                            isFetching={isFetchingCategoriesData}
                            rows={rows}
                            errorMessage="Ocurrió un error al cargar las categorías."
                            noDataMessage="No se encontraron categorías."
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
        </Card>
    );
}
export default CategoryListTable;