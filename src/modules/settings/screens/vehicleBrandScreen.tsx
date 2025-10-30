import { Kbd } from "@/components/atoms/kbd";
import TooltipButton from "@/components/common/TooltipButton";
import { useGoBack } from "@/hooks/useGoBack";
import { Car, CornerUpLeft, Edit, Filter, RefreshCcw, Search, Trash2 } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { Input } from "@/components/atoms/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import type { DialogConfig } from "../types/configFormDialog.types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConfigFormDialog } from "../components/configFormDialog";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useLocation, useNavigate } from "react-router";
import ConfirmationModal from "@/components/common/confirmationModal";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import { useVehicleBrandFilters } from "../hooks/vehicleBrand/useVehicleBrandFilters";
import { useGetAllVehicleBrands } from "../hooks/vehicleBrand/useGetAllVehicleBrands";
import { useGetVehicleBrandById } from "../hooks/vehicleBrand/useGetVehicleBrandById";
import { useCreateVehicleBrand } from "../hooks/vehicleBrand/useCreateVehicleBrand";
import { useUpdateVehicleBrand } from "../hooks/vehicleBrand/useUpdateVehicleBrand";
import { useDeleteVehicleBrand } from "../hooks/vehicleBrand/useDeleteVehicleBrand";
import type { CreateVehicleBrand, UpdateVehicleBrand, VehicleBrand } from "../types/vehicleBrand.types";
import { CreateVehicleBrandSchema, UpdateVehicleBrandSchema } from "../schemas/vehicleBrand.schema";
import authSDK from "@/services/sdk-simple-auth";
import { useCustomTable } from "@/hooks/useCustomTable";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";

const VEHICLE_BRANDS_DIALOG_CONFIG: DialogConfig = {
    title: "Marca de Vehículo",
    description: "una marca de vehículo",
    field: {
        name: "marca_vehiculo",
        label: "Marca de vehículo",
        placeholder: "Ingresa el nombre de la marca de vehículo...",
        required: true,
    }
};

const VehicleBrandsScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const user = authSDK.getCurrentUser()
    const [isDraggingColumn, setIsDraggingColumn] = useState(false);
    const tableRef = useRef<HTMLTableElement>(null)

    const {
        filters,
        updateFilter,
        debouncedFilters,
        resetFilters,
        setPage,
    } = useVehicleBrandFilters()

    const {
        data: vehicleBrandsData,
        refetch: handleRefetchVehicleBrandsData,
        isFetching: isFetchingVehicleBrandsData,
        isRefetching: isRefetchingVehicleBrandsData,
        isLoading: isLoadingVehicleBrandsData,
        isError: isErrorVehicleBrandsData,
    } = useGetAllVehicleBrands(debouncedFilters)

    const {
        data: vehicleBrandById,
        isLoading: isLoadingVehicleBrandById,
        isError: isErrorVehicleBrandById,
        error: errorVehicleBrandById
    } = useGetVehicleBrandById(editingId || 0)

    const {
        mutate: handleCreateVehicleBrand,
        isPending: isCreating
    } = useCreateVehicleBrand()

    const {
        mutate: handleUpdateVehicleBrand,
        isPending: isUpdating
    } = useUpdateVehicleBrand()

    const { handleError } = useErrorHandler()

    const handleGoBack = useGoBack("/dashboard/settings");

    const handleDeleteSuccess = useCallback((_data: unknown, id: number) => {
        showSuccessToast({
            title: "Marca de vehículo eliminada",
            description: `La marca de vehículo #${id} se eliminó exitosamente`,
            duration: 5000
        });
        setEditingId(null);
    }, []);

    const handleDeleteError = useCallback((error: unknown, id: number) => {
        handleError({ error, customTitle: `Error al eliminar marca de vehículo #${id}` });
    }, [handleError]);

    const {
        mutate: deleteVehicleBrand,
        isPending: isDeleting
    } = useDeleteVehicleBrand()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: itemToDelete
    } = useConfirmMutation(deleteVehicleBrand, handleDeleteSuccess, handleDeleteError)

    // Forms
    const createForm = useForm<CreateVehicleBrand>({
        resolver: zodResolver(CreateVehicleBrandSchema),
        defaultValues: {
            marca_vehiculo: ''
        },
    });

    const updateForm = useForm<UpdateVehicleBrand>({
        resolver: zodResolver(UpdateVehicleBrandSchema),
        defaultValues: {
            marca_vehiculo: ''
        },
    });

    const isEditing = useMemo(() => editingId !== null, [editingId]);
    const currentForm = useMemo(() => isEditing ? updateForm : createForm, [isEditing, updateForm, createForm]);
    const isSaving = useMemo(() => isCreating || isUpdating, [isCreating, isUpdating]);
    const totalRecords = useMemo(() => vehicleBrandsData?.meta?.total || 0, [vehicleBrandsData?.meta?.total]);
    const isRefreshing = useMemo(() => isRefetchingVehicleBrandsData || isFetchingVehicleBrandsData, [isRefetchingVehicleBrandsData, isFetchingVehicleBrandsData]);

    useEffect(() => {
        if (location.state?.openModal) {
            handleAddVehicleBrand()
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (vehicleBrandById && isEditing) {
            updateForm.reset({
                marca_vehiculo: vehicleBrandById.marca_vehiculo
            });
        }
    }, [vehicleBrandById, isEditing, updateForm]);

    const handleAddVehicleBrand = useCallback(() => {
        setEditingId(null);
        createForm.reset();
        setIsDialogOpen(true);
    }, [createForm]);

    const handleEditVehicleBrand = useCallback((id: number) => {
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

    const handleCreateSubmit = useCallback(createForm.handleSubmit(async (data: CreateVehicleBrand) => {
        handleCreateVehicleBrand(data, {
            onSuccess: () => {
                showSuccessToast({
                    title: "Marca de vehículo Agregada",
                    description: "Marca de vehículo agregada exitosamente",
                    duration: 5000
                });
                handleDialogToggle(false);
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo agregar la marca de vehículo" });
            }
        });
    }), [createForm, handleCreateVehicleBrand, handleDialogToggle, handleError]);

    const handleUpdateSubmit = useCallback(updateForm.handleSubmit(async (data: UpdateVehicleBrand) => {
        if (!editingId) {
            showErrorToast({
                title: "Error al modificar marca de vehículo",
                description: "No se pudo modificar la marca de vehículo. Por favor, intenta nuevamente",
                duration: 5000
            });
            return;
        }

        handleUpdateVehicleBrand({ data, id: editingId }, {
            onSuccess: () => {
                showSuccessToast({
                    title: "Marca de vehículo Modificada",
                    description: "Marca de vehículo modificada exitosamente",
                    duration: 5000
                });
                handleDialogToggle(false);
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo modificar la marca de vehículo" });
            }
        });
    }), [updateForm, editingId, handleUpdateVehicleBrand, handleDialogToggle, handleError]);

    const handleRowsChange = useCallback((rows: number) => {
        updateFilter("pagina_registros", rows);
    }, [updateFilter]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateFilter("marca_vehiculo", e.target.value);
    }, [updateFilter]);

    useEffect(() => {
        if (!isErrorVehicleBrandById) return
        handleError({ error: errorVehicleBrandById, customTitle: "Ocurrió un error al cargar los datos" });
        handleDialogToggle(false)
    }, [isErrorVehicleBrandById, errorVehicleBrandById, handleError, handleDialogToggle])

    const columns = useMemo<ColumnDef<VehicleBrand>[]>(() => [
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
            accessorKey: "marca_vehiculo",
            header: "Marca de Vehículo",
            cell: ({ getValue }) => (
                <h3 className="font-medium text-gray-700 truncate">
                    {getValue<string>()}
                </h3>
            )
        },
        {
            id: "actions",
            header: "Acciones",
            size: 80,
            cell: ({ row }) => {
                const id = row.original.id
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            className="w-8 cursor-pointer"
                            variant={"outline"}
                            onClick={() => handleEditVehicleBrand(id)}
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
    ], [handleEditVehicleBrand, handleOpenDeleteAlert]);

    const {
        table,
    } = useCustomTable({
        data: vehicleBrandsData?.data || [],
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
        persistenceKey: `vehicleBrand-table-${user?.name}`,
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    const {
        selectedIndex,
        setSelectedIndex,
        isFocused,
        // hotkeys
    } = useKeyboardNavigation<VehicleBrand, HTMLTableElement>({
        items: vehicleBrandsData?.data || [],
        containerRef: tableRef,
        isDragging: isDraggingColumn,
        onPrimaryAction: (vehicleBrand) => {
            handleEditVehicleBrand(vehicleBrand.id)
        },
        getItemId: (vehicleBrand) => vehicleBrand.id
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

    // Shortcuts
    useHotkeys('escape', (e) => {
        e.preventDefault();
        handleGoBack();
    }, {
        scopes: ["esc-key"],
        enabled: true
    });

    return (
        <main className="w-full max-w-5xl mx-auto h-full p-2 gap-2 flex flex-col">
            <div className="space-y-2 flex-shrink-0">
                <header className="bg-card rounded-lg p-2 border border-border">
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TooltipButton
                                tooltipContentProps={{
                                    align: 'start'
                                }}
                                onClick={handleGoBack}
                                tooltip={<p className="flex items-center gap-1">Presiona <Kbd>esc</Kbd> para volver atrás</p>}
                                buttonProps={{
                                    variant: 'default',
                                    type: 'button',
                                    className: 'size-9'
                                }}
                            >
                                <CornerUpLeft />
                            </TooltipButton>
                            <div>
                                <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight">
                                    Marcas de Vehículo
                                </h1>
                                <p className="text-sm text-gray-500">Marcas de vehículos</p>
                            </div>
                        </div >
                    </div >
                </header >

                <Card className="shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-primary">
                            <Filter className="size-5 text-gray-700" />
                            Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <section className="grid gap-2 sm:grid-cols-2">
                            <div className="flex w-full relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar marca de vehículo..."
                                    value={filters.marca_vehiculo}
                                    onChange={handleSearchChange}
                                    className="pl-10"
                                />
                            </div>

                            <div className="flex gap-2 justify-end w-full">
                                <TooltipButton
                                    onClick={handleRefetchVehicleBrandsData}
                                    buttonProps={{
                                        className: 'w-8',
                                        disabled: isRefreshing,
                                    }}
                                    tooltip={"Recargar datos"}
                                >
                                    <RefreshCcw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </TooltipButton>

                                <Button onClick={resetFilters}>
                                    <Filter className="size-4" />
                                    Limpiar Filtros
                                </Button>
                            </div>
                        </section>
                    </CardContent>
                </Card>
            </div>

            <div className="flex-1 min-h-screen md:min-h-0 overflow-hidden">
                <Card className="h-full flex flex-col">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 flex-shrink-0">
                        <div>
                            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-primary">
                                <Car className="size-5 text-gray-700" />
                                Gestionar Marcas de Vehículo
                            </CardTitle>
                            <CardDescription className="text-sm">
                                {totalRecords} elemento{totalRecords !== 1 ? "s" : ""} registrado
                                {totalRecords !== 1 ? "s" : ""}
                            </CardDescription>
                        </div>
                        <ConfigFormDialog
                            config={VEHICLE_BRANDS_DIALOG_CONFIG}
                            isOpen={isDialogOpen}
                            onOpenChange={handleDialogToggle}
                            onSubmit={isEditing ? handleUpdateSubmit : handleCreateSubmit}
                            register={currentForm.register}
                            errors={currentForm.formState.errors}
                            isLoading={isLoadingVehicleBrandById}
                            isEditing={isEditing}
                            editingId={editingId}
                            isSaving={isSaving}
                        />
                    </CardHeader>
                    <CardContent className="h-full flex flex-col overflow-hidden">
                        <div className="flex-1 min-h-0">
                            <div className="h-full overflow-auto">
                                <CustomizableTable
                                    table={table}
                                    isLoading={isLoadingVehicleBrandsData}
                                    isError={isErrorVehicleBrandsData}
                                    isFetching={isFetchingVehicleBrandsData}
                                    rows={filters.pagina_registros}
                                    errorMessage="Ocurrió un error al cargar las marcas de vehículo."
                                    noDataMessage="No se encontraron marcas de vehículo."
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
                                currentPage={filters.pagina || 1}
                                onPageChange={setPage}
                                totalData={totalRecords}
                                onShowRowsChange={handleRowsChange}
                                showRows={filters.pagina_registros}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar marca de vehículo"
                message={`¿Estás seguro de que deseas eliminar la marca de vehículo #${itemToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main>
    );
}
export default VehicleBrandsScreen;