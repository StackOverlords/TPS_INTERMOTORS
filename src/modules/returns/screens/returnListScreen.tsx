import { useBranchStore } from "@/states/branchStore";
import { useEffect, useState } from "react";
import { PackageSearch, RefreshCcw, Search, Zap } from "lucide-react";
import { Input } from "@/components/atoms/input";
import { Switch } from "@/components/atoms/switch";
import { Label } from "@/components/atoms/label";
import TooltipButton from "@/components/common/TooltipButton";
import { Button } from "@/components/atoms/button";
import { Separator } from "@/components/atoms/separator";
import ConfirmationModal from "@/components/common/confirmationModal";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import type { ReturnGetAll } from "../types/returnGet.types";
import { useReturnsFilters } from "../hooks/useReturnsFilters";
import { useReturnsGetAll } from "../hooks/useReturnsGetAll";
import { useDeleteReturn } from "../hooks/useDeleteReturn";
import ReturnsFiltersComponent from "../components/returnList/returnFilterComponent";
import ReturnsListTable from "../components/returnList/returnListTable";
import { useViewConfig } from "@/hooks/useViewConfig";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { useCommands } from "@/keybindings";

const ReturnListScreen = () => {
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId)
    const {
        config,
        isFeatureEnabled,
        getBehaviorValue,
    } = useViewConfig('returns-list');

    const [isInfiniteScroll, setIsInfiniteScroll] = useState(
        getBehaviorValue<boolean>('infiniteScroll') ?? false
    );
    const [showFilters, setShowFilters] = useState(
        getBehaviorValue<boolean>('showFiltersOnMount') ?? true
    );
    const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>(
        getBehaviorValue<'realtime' | 'manual'>('defaultSearchMode') ?? 'manual'
    );
    const [returns, setReturns] = useState<ReturnGetAll[]>([]);

    const {
        filters,
        debouncedFilters,
        appliedFilters,
        updateFilter,
        setPage,
        resetFilters,
        applyFilters,
        setPageSize,
    } = useReturnsFilters(Number(selectedBranchId) || 1)

    // Determinar qué filtros usar según el modo
    const activeFilters = searchMode === 'realtime' ? debouncedFilters : appliedFilters;

    const {
        data: returnsData,
        isLoading,
        error,
        isFetching,
        isError,
        refetch: refetchReturns,
        isRefetching: isRefetchingReturns,
    } = useReturnsGetAll(activeFilters)

    useEffect(() => {
        if (!returnsData?.data || error || isFetching) return;

        if (isInfiniteScroll && filters.pagina && filters.pagina > 1) {
            setReturns((prev) => {
                // Evitar duplicados
                const newOrders = returnsData.data.filter(
                    newOrder => !prev.some(existingOrder => existingOrder.id === newOrder.id)
                );
                return [...prev, ...newOrders];
            });
        } else {
            setReturns(returnsData.data);
        }
    }, [returnsData?.data, isInfiniteScroll, filters.pagina, error, isFetching]);

    const handleResetFilters = () => {
        resetFilters()
    }

    // Manejar búsqueda manual
    const handleManualSearch = () => {
        if (searchMode === 'manual') {
            applyFilters();
        }
    };

    // Toggle del modo de búsqueda
    const toggleSearchMode = () => {
        setSearchMode(prev => prev === 'realtime' ? 'manual' : 'realtime');
    };

    const handleDeleteSuccess = (_data: unknown, Id: number) => {
        showSuccessToast({
            title: "Devolución eliminada",
            description: `La Devolución #${Id} se eliminó exitosamente`,
            duration: 5000
        })
    };

    const handleDeleteError = (_error: unknown, Id: number) => {
        showErrorToast({
            title: "Error al eliminar Devolución",
            description: `No se pudo eliminar la Devolución #${Id}. Por favor, intenta nuevamente`,
            duration: 5000
        })
    };

    const {
        mutate: deleteReturn,
        isPending: isDeleting
    } = useDeleteReturn()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: returnToDelete
    } = useConfirmMutation(deleteReturn, handleDeleteSuccess, handleDeleteError)

    const handleRefetchReturns = () => {
        refetchReturns();
    }

    const handleInfiniteScrollChange = (checked: boolean) => {
        setIsInfiniteScroll(checked);
        setPage(1);
    };

    const toggleShowFilters = () => {
        setShowFilters(!showFilters);
    }
    useFormEnterNavigation({
        submitOnLastField: false,
        excludeSelectors: [
            '.no-enter-nav',
            '.columns-button',
            '.toggle-mode',
            '.reload-button',
            '.switch-button'
        ],
        enabled: true,
    })

    useCommands({
        'searchFilters.focusSearch': handleManualSearch,
        'forms.reset': handleResetFilters
    }, {
        enableOnFormTags: true
    })

    return (
        <main className="h-full p-2 gap-2 flex flex-col">
            <header className="bg-card rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
                <h1 className="text-lg font-bold text-primary">Devoluciones</h1>
                <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
                    <div className="flex items-center gap-2 md:gap-4 grow">
                        {
                            isFeatureEnabled('keywordFilter') && (
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Buscar por palabras clave..."
                                        value={filters.keywords}
                                        onChange={(e) => updateFilter("keywords", e.target.value)}
                                        className="pl-10 w-full"
                                    />
                                </div>
                            )
                        }
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {isFeatureEnabled('searchModeToggle') && (
                            <Button
                                type='button'
                                size="sm"
                                variant="ghost"
                                onClick={toggleSearchMode}
                                className="text-xs h-7"
                                title={searchMode === 'realtime' ? 'Cambiar a búsqueda manual' : 'Cambiar a búsqueda en tiempo real'}
                            >
                                <Zap className={`h-3 w-3 ${searchMode === 'realtime' ? 'text-yellow-500' : 'text-gray-500'}`} />
                                {searchMode === 'realtime' ? 'Tiempo real' : 'Manual'}
                            </Button>
                        )}

                        {isFeatureEnabled('infiniteScrollToggle') && (
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="infinite-scroll"
                                    checked={isInfiniteScroll}
                                    onCheckedChange={handleInfiniteScrollChange}
                                />
                                <Label htmlFor="infinite-scroll">
                                    Scroll Infinito
                                </Label>
                            </div>
                        )}

                        {isFeatureEnabled('refreshButton') && (
                            <TooltipButton
                                onClick={handleRefetchReturns}
                                buttonProps={{
                                    className: 'w-8',
                                    disabled: isRefetchingReturns || isFetching,
                                }}
                                tooltip={config?.features?.refreshButton?.description || "Recargar devoluciónes"}
                            >
                                <RefreshCcw className={`size-4 ${isRefetchingReturns || isFetching ? 'animate-spin' : ''}`} />
                            </TooltipButton>
                        )}

                        {
                            isFeatureEnabled('clearFiltersButton') && (
                                // <Button title={config.features?.clearFiltersButton?.description} variant="outline" size="sm" onClick={handleResetFilters}>
                                //     <FilterX className="h-4 w-4" />
                                //     Limpiar Filtros
                                // </Button>
                                <Button onClick={handleResetFilters}>
                                    <PackageSearch className="h-4 w-4" />
                                    Nueva búsqueda
                                </Button>
                            )
                        }

                        {isFeatureEnabled('hideFiltersButton') && (
                            <Button size={'sm'} onClick={toggleShowFilters}>
                                {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                            </Button>
                        )}
                    </div>
                </section>
                {/* Búsquedas individuales */}
                {
                    showFilters && (
                        <>
                            <Separator />
                            <ReturnsFiltersComponent
                                filters={filters}
                                updateFilter={updateFilter}
                                handleManualSearch={handleManualSearch}
                                searchMode={searchMode}
                            />
                        </>
                    )
                }
            </header>

            <div className="bg-card rounded-lg border border-border flex-1 min-h-screen md:min-h-0 overflow-hidden">
                <ReturnsListTable
                    data={returnsData || { data: [], meta: null, links: null }}
                    filters={filters}
                    isError={isError}
                    isFetching={isFetching}
                    isInfiniteScroll={isInfiniteScroll}
                    isLoading={isLoading}
                    returns={returns}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    handleDeleteSale={handleOpenDeleteAlert}
                />
            </div>
            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar Devolución"
                message={`¿Estás seguro de que deseas eliminar la Devolución #${returnToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main>
    );
}

export default ReturnListScreen;