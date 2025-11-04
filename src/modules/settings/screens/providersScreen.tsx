import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import ConfirmationModal from "@/components/common/confirmationModal";
import TooltipButton from "@/components/common/TooltipButton";
import { showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useGoBack } from "@/hooks/useGoBack";
import { CornerUpLeft, Filter, RefreshCcw, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useProviderFilters } from "../hooks/provider/useProviderFilters";
import { useDeleteProvider } from "../hooks/provider/useDeleteProvider";
import { useGetAllProviders } from "../hooks/provider/useGetAllProviders";
import ProviderListTable from "../components/providerListTable";

const ProvidersScreen = () => {
    // Estado local para los filtros (búsqueda manual)
    const [localProveedor, setLocalProveedor] = useState("");
    const [localNit, setLocalNit] = useState("");
    const [localCodigoInterno, setLocalCodigoInterno] = useState("");
    const [localActivo, setLocalActivo] = useState<string>("all");


    const {
        filters,
        updateFilter,
        debouncedFilters,
        resetFilters,
        setPage,
    } = useProviderFilters()

    const {
        data: providersData,
        refetch: handleRefetchProvidersData,
        isFetching: isFetchingProvidersData,
        isRefetching: isRefetchingProvidersData,
        isLoading: isLoadingProvidersData,
        isError: isErrorProvidersData,
    } = useGetAllProviders(debouncedFilters)

    const { handleError } = useErrorHandler()

    const handleGoBack = useGoBack("/dashboard/settings");

    const handleDeleteSuccess = useCallback((_data: unknown, id: number) => {
        showSuccessToast({
            title: "Proveedor eliminado",
            description: `El Proveedor #${id} se eliminó exitosamente`,
            duration: 5000
        });
    }, []);

    const handleDeleteError = useCallback((error: unknown, id: number) => {
        handleError({ error, customTitle: `Error al eliminar Proveedor #${id}` });
    }, [handleError]);

    const {
        mutate: deleteProvider,
        isPending: isDeleting
    } = useDeleteProvider()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: itemToDelete
    } = useConfirmMutation(deleteProvider, handleDeleteSuccess, handleDeleteError)

    const totalRecords = useMemo(() => providersData?.meta?.total || 0, [providersData?.meta?.total]);
    const isRefreshing = useMemo(() => isRefetchingProvidersData || isFetchingProvidersData, [isRefetchingProvidersData, isFetchingProvidersData]);

    const handleRowsChange = useCallback((rows: number) => {
        updateFilter("pagina_registros", rows);
    }, [updateFilter]);

    // Handlers locales
    const handleLocalProveedorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalProveedor(e.target.value);
    }, []);

    const handleLocalNitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalNit(e.target.value);
    }, []);

    const handleLocalCodigoInternoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalCodigoInterno(e.target.value);
    }, []);

    const handleLocalActivoChange = useCallback((value: string) => {
        setLocalActivo(value);
    }, []);

    // Aplicar filtros al presionar búsqueda
    const handleSearch = useCallback(() => {
        updateFilter("proveedor", localProveedor);
        updateFilter("nit", localNit);

        if (localCodigoInterno) {
            updateFilter("codigo_interno", Number(localCodigoInterno));
        } else {
            updateFilter("codigo_interno", undefined);
        }

        if (localActivo === "all") {
            updateFilter("activo", undefined);
        } else {
            updateFilter("activo", Number(localActivo));
        }
        setPage(1);
    }, [localProveedor, localNit, localCodigoInterno, localActivo, updateFilter, setPage]);

    const handleResetFilters = () => {
        setLocalProveedor("");
        setLocalNit("");
        setLocalCodigoInterno("");
        setLocalActivo("all");
        resetFilters();
    }

    // Shortcuts
    useHotkeys('escape', (e) => {
        e.preventDefault();
        handleGoBack();
    }, {
        scopes: ["esc-key"],
        enabled: true
    });

    return (
        <main className="w-full max-w-7xl mx-auto h-full p-2 gap-2 flex flex-col">
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
                                    Proveedores
                                </h1>
                                <p className="text-sm text-gray-500">Gestiona los proveedores de la aplicación</p>
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
                        <section className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                <div>
                                    <Label htmlFor="proveedor">Proveedor</Label>
                                    <Input
                                        id="proveedor"
                                        placeholder="Buscar proveedor..."
                                        value={localProveedor}
                                        onChange={handleLocalProveedorChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch();
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="nit">NIT</Label>
                                    <Input
                                        id="nit"
                                        placeholder="Buscar por NIT..."
                                        value={localNit}
                                        onChange={handleLocalNitChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch();
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="codigo_interno">Código Interno</Label>
                                    <Input
                                        id="codigo_interno"
                                        type="number"
                                        placeholder="Código..."
                                        value={localCodigoInterno}
                                        onChange={handleLocalCodigoInternoChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch();
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="activo">Estado</Label>
                                    <Select
                                        value={localActivo}
                                        onValueChange={handleLocalActivoChange}
                                    >
                                        <SelectTrigger id="activo">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="1">Activos</SelectItem>
                                            <SelectItem value="0">Inactivos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end w-full">
                                <Button onClick={handleSearch}>
                                    <Search className="size-4" />
                                    Buscar
                                </Button>

                                <TooltipButton
                                    onClick={handleRefetchProvidersData}
                                    buttonProps={{
                                        className: 'w-8',
                                        disabled: isRefreshing,
                                    }}
                                    tooltip={"Recargar datos"}
                                >
                                    <RefreshCcw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </TooltipButton>

                                <Button onClick={handleResetFilters}>
                                    <Filter className="size-4" />
                                    Limpiar Filtros
                                </Button>
                            </div>
                        </section>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de Proveedores */}
            <div className="flex-1 min-h-screen md:min-h-0 overflow-hidden">
                <ProviderListTable
                    providers={providersData?.data || []}
                    handleOpenDeleteAlert={handleOpenDeleteAlert}
                    isLoadingProvidersData={isLoadingProvidersData}
                    isErrorProvidersData={isErrorProvidersData}
                    isFetchingProvidersData={isFetchingProvidersData}
                    rows={filters.pagina_registros}
                    page={filters.pagina}
                    totalRecords={totalRecords}
                    handleRowsChange={handleRowsChange}
                    onPageChange={setPage}
                />
            </div>

            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar proveedor"
                message={`¿Estás seguro de que deseas eliminar el proveedor #${itemToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main>
    );
}
export default ProvidersScreen;
