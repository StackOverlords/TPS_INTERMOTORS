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
import BranchListTable from "../components/branchListTable";
import { useBranchFilters } from "../hooks/branch/useBranchFilters";
import { useDeleteBranch } from "../hooks/branch/useDeleteBranch";
import { useGetAllBranches } from "../hooks/branch/useGetAllBranches";

const BranchesScreen = () => {
    // Estado local para los filtros (sin aplicar hasta hacer búsqueda)
    const [localNombre, setLocalNombre] = useState("");
    const [localEstado, setLocalEstado] = useState<string>("all");

    const {
        filters,
        updateFilter,
        debouncedFilters,
        resetFilters,
        setPage,
    } = useBranchFilters()

    const {
        data: branchesData,
        refetch: handleRefetchBranchesData,
        isFetching: isFetchingBranchesData,
        isRefetching: isRefetchingBranchesData,
        isLoading: isLoadingBranchesData,
        isError: isErrorBranchesData,
    } = useGetAllBranches(debouncedFilters)

    const { handleError } = useErrorHandler()

    const handleGoBack = useGoBack("/dashboard/settings");

    const handleDeleteSuccess = useCallback((_data: unknown, id: number) => {
        showSuccessToast({
            title: "Sucursal eliminada",
            description: `La Sucursal #${id} se eliminó exitosamente`,
            duration: 5000
        });
    }, []);

    const handleDeleteError = useCallback((error: unknown, id: number) => {
        handleError({ error, customTitle: `Error al eliminar Sucursal #${id}` });
    }, [handleError]);

    const {
        mutate: deleteBranch,
        isPending: isDeleting
    } = useDeleteBranch()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: itemToDelete
    } = useConfirmMutation(deleteBranch, handleDeleteSuccess, handleDeleteError)

    const totalRecords = useMemo(() => branchesData?.meta?.total || 0, [branchesData?.meta?.total]);
    const isRefreshing = useMemo(() => isRefetchingBranchesData || isFetchingBranchesData, [isRefetchingBranchesData, isFetchingBranchesData]);

    const handleRowsChange = useCallback((rows: number) => {
        updateFilter("pagina_registros", rows);
    }, [updateFilter]);

    // Cambio local del nombre (sin aplicar filtro)
    const handleLocalSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalNombre(e.target.value);
    }, []);

    // Cambio local del estado (sin aplicar filtro)
    const handleLocalEstadoChange = useCallback((value: string) => {
        setLocalEstado(value);
    }, []);

    // Aplicar filtros al presionar el botón de búsqueda
    const handleSearch = useCallback(() => {
        updateFilter("nombre", localNombre);
        if (localEstado === "all") {
            updateFilter("estado", undefined);
        } else {
            updateFilter("estado", localEstado === "true");
        }
        setPage(1); // Resetear a la primera página
    }, [localNombre, localEstado, updateFilter, setPage]);

    const handleResetFilters = () => {
        setLocalNombre("");
        setLocalEstado("all");
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
                                    Sucursales
                                </h1>
                                <p className="text-sm">Gestiona las sucursales de la aplicación</p>
                            </div>
                        </div >
                    </div >
                </header >

                <Card className="shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-primary">
                            <Filter className="size-5 text-muted-foreground" />
                            Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <section className="grid gap-2 sm:grid-cols-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label htmlFor="nombre">Nombre</Label>
                                    <div className="flex w-full relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="nombre"
                                            placeholder="Buscar sucursal..."
                                            value={localNombre}
                                            onChange={handleLocalSearchChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearch();
                                                }
                                            }}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="estado">Estado</Label>
                                    <Select
                                        value={localEstado}
                                        onValueChange={handleLocalEstadoChange}
                                    >
                                        <SelectTrigger id="estado">
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="true">Activos</SelectItem>
                                            <SelectItem disabled value="false">Inactivos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end w-full items-end">
                                <Button onClick={handleSearch}>
                                    <Search className="size-4" />
                                    Buscar
                                </Button>

                                <TooltipButton
                                    onClick={handleRefetchBranchesData}
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

            <div className="flex-1 min-h-screen md:min-h-0 overflow-hidden">
                <BranchListTable
                    branches={branchesData?.data || []}
                    handleOpenDeleteAlert={handleOpenDeleteAlert}
                    isErrorBranchesData={isErrorBranchesData}
                    isFetchingBranchesData={isFetchingBranchesData}
                    isLoadingBranchesData={isLoadingBranchesData}
                    rows={filters.pagina_registros}
                    handleRowsChange={handleRowsChange}
                    onPageChange={setPage}
                    page={filters.pagina}
                    totalRecords={totalRecords}
                />
            </div>

            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar sucursal"
                message={`¿Estás seguro de que deseas eliminar la sucursal #${itemToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main>
    );
}
export default BranchesScreen;
