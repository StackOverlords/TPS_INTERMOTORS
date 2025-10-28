import { Kbd } from "@/components/atoms/kbd";
import TooltipButton from "@/components/common/TooltipButton";
import { useGoBack } from "@/hooks/useGoBack";
import { CornerUpLeft, Filter, RefreshCcw, Search } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { Input } from "@/components/atoms/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { useCallback, useMemo, useState } from "react";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { showSuccessToast } from "@/hooks/use-toast-enhanced";
import ConfirmationModal from "@/components/common/confirmationModal";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import { useCategoryFilters } from "../hooks/category/useCategoryFilters";
import { useGetAllCategories } from "../hooks/category/useGetAllCategories";
import { useDeleteCategory } from "../hooks/category/useDeleteCategory";
import { Label } from "@/components/atoms/label";
import CategoryListTable from "../components/categoryListTable";

const CategoriesScreen = () => {
    const [codigo_interno, setCodigoInterno] = useState("")

    const {
        filters,
        updateFilter,
        debouncedFilters,
        resetFilters,
        setPage,
    } = useCategoryFilters()

    const {
        data: categoriesData,
        refetch: handleRefetchCategoriesData,
        isFetching: isFetchingCategoriesData,
        isRefetching: isRefetchingCategoriesData,
        isLoading: isLoadingCategoriesData,
        isError: isErrorCategoriesData,
    } = useGetAllCategories(debouncedFilters)

    const { handleError } = useErrorHandler()

    const handleGoBack = useGoBack("/dashboard/settings");

    const handleDeleteSuccess = useCallback((_data: unknown, id: number) => {
        showSuccessToast({
            title: "Categoría eliminada",
            description: `La Categoría #${id} se eliminó exitosamente`,
            duration: 5000
        });
    }, []);

    const handleDeleteError = useCallback((error: unknown, id: number) => {
        handleError({ error, customTitle: `Error al eliminar Categoría #${id}` });
    }, [handleError]);

    const {
        mutate: deleteCategory,
        isPending: isDeleting
    } = useDeleteCategory()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: itemToDelete
    } = useConfirmMutation(deleteCategory, handleDeleteSuccess, handleDeleteError)

    const totalRecords = useMemo(() => categoriesData?.meta?.total || 0, [categoriesData?.meta?.total]);
    const isRefreshing = useMemo(() => isRefetchingCategoriesData || isFetchingCategoriesData, [isRefetchingCategoriesData, isFetchingCategoriesData]);

    const handleRowsChange = useCallback((rows: number) => {
        updateFilter("pagina_registros", rows);
    }, [updateFilter]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateFilter("categoria", e.target.value);
    }, [updateFilter]);

    const handleFilterByInternalCode = useCallback(() => {
        updateFilter("codigo_interno", Number(codigo_interno))
    }, [updateFilter, codigo_interno])

    const handleResetFilters = () => {
        resetFilters()
        setCodigoInterno("")
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
                                    Categorías
                                </h1>
                                <p className="text-sm text-gray-500">Categorías principales</p>
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
                            <div className=" grid grid-cols-2 gap-2">
                                <div>
                                    <Label htmlFor="categoria">Categoría</Label>
                                    <div className="flex w-full relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar categoría..."
                                            value={filters.categoria}
                                            onChange={handleSearchChange}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Cod. Interno</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={codigo_interno}
                                            onChange={(e) => setCodigoInterno(e.target.value)}
                                            placeholder="Ej. 16"
                                        />
                                        <TooltipButton
                                            tooltipContentProps={{
                                                align: 'center'
                                            }}
                                            onClick={handleFilterByInternalCode}
                                            tooltip={<p className="flex items-center gap-1">Buscar por código interno</p>}
                                            buttonProps={{
                                                variant: 'default',
                                                type: 'button',
                                                className: 'cursor-pointer'
                                            }}
                                        >
                                            <Search className="size-4 " />
                                        </TooltipButton>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end w-full items-end">
                                <TooltipButton
                                    onClick={handleRefetchCategoriesData}
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
                <CategoryListTable
                    categories={categoriesData?.data || []}
                    handleOpenDeleteAlert={handleOpenDeleteAlert}
                    isErrorCategoriesData={isErrorCategoriesData}
                    isFetchingCategoriesData={isFetchingCategoriesData}
                    isLoadingCategoriesData={isLoadingCategoriesData}
                    rows={filters.pagina_registros}
                    handleRowsChange={handleRowsChange}
                    onPageChange={setPage}
                    page={filters.pagina}
                    totalRecords={totalRecords}
                />
            </div>

            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar categoría"
                message={`¿Estás seguro de que deseas eliminar la categoría #${itemToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main>
    );
}
export default CategoriesScreen;