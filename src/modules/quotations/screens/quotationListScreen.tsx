import { useBranchStore } from "@/states/branchStore";
import { useEffect, useRef, useState } from "react";
import { FilterX, PackageSearch, RefreshCcw, Search, Zap } from "lucide-react";
import { Input } from "@/components/atoms/input";
import { Switch } from "@/components/atoms/switch";
import { Label } from "@/components/atoms/label";
import TooltipButton from "@/components/common/TooltipButton";
import { Button } from "@/components/atoms/button";
import { Separator } from "@/components/atoms/separator";
import ConfirmationModal from "@/components/common/confirmationModal";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import type { QuotationGetAll } from "../types/quotationGet.types";
import { useSalesFilters } from "@/modules/sales/hooks/useSalesFilters";
import { useQuotationsPaginated } from "../hooks/useQuotationsPaginated";
import QuotationsListTable from "../components/quotationList/quotationListTable";
import QuotationsFiltersComponent from "../components/quotationList/quotationFilterComponent";
import { useDeleteQuotation } from "../hooks/useDeleteQuotation";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { useViewConfig } from "@/hooks/useViewConfig";
import { useCommands } from "@/keybindings";

const QuotationListScreen = () => {
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId)
    const {
        config,
        isFeatureEnabled,
        getBehaviorValue,
    } = useViewConfig('quotations-list');

    const [isInfiniteScroll, setIsInfiniteScroll] = useState(
        getBehaviorValue<boolean>('infiniteScroll') ?? false
    );
    const [showFilters, setShowFilters] = useState(
        getBehaviorValue<boolean>('showFiltersOnMount') ?? true
    );
    const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>(
        getBehaviorValue<'realtime' | 'manual'>('defaultSearchMode') ?? 'manual'
    );
    const [quotations, setQuotations] = useState<QuotationGetAll[]>([]);

    const {
        filters,
        debouncedFilters,
        appliedFilters,
        updateFilter,
        setPage,
        resetFilters,
        applyFilters,
        setPageSize,
    } = useSalesFilters(Number(selectedBranchId) || 1)

    // Determinar qué filtros usar según el modo
    const activeFilters = searchMode === 'realtime' ? debouncedFilters : appliedFilters;

    const {
        data: quotationData,
        isLoading,
        error,
        isFetching,
        isError,
        refetch: refetchQuotations,
        isRefetching: isRefetchingQuotations,
    } = useQuotationsPaginated(activeFilters)

    useEffect(() => {
        if (!quotationData?.data || error || isFetching) return;

        if (isInfiniteScroll && filters.pagina && filters.pagina > 1) {
            setQuotations((prev) => {
                // Evitar duplicados
                const newQuotations = quotationData.data.filter(
                    newQuotation => !prev.some(existingQuotation => existingQuotation.id === newQuotation.id)
                );
                return [...prev, ...newQuotations];
            });
        } else {
            setQuotations(quotationData.data);
        }
    }, [quotationData?.data, isInfiniteScroll, filters.pagina, error, isFetching]);

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

    const handleDeleteSuccess = (_data: unknown, quotationId: number) => {
        showSuccessToast({
            title: "Cotizacion eliminada",
            description: `La cotizacion #${quotationId} se eliminó exitosamente`,
            duration: 5000
        })
    };

    const handleDeleteError = (_error: unknown, quotationId: number) => {
        showErrorToast({
            title: "Error al eliminar cotizacion",
            description: `No se pudo eliminar la cotizacion #${quotationId}. Por favor, intenta nuevamente`,
            duration: 5000
        })
    };

    const {
        mutate: deleteQuotation,
        isPending: isDeleting
    } = useDeleteQuotation()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: quotationToDelete
    } = useConfirmMutation(deleteQuotation, handleDeleteSuccess, handleDeleteError)

    const handleRefetchQuotations = () => {
        refetchQuotations();
    }

    const handleInfiniteScrollChange = (checked: boolean) => {
        setIsInfiniteScroll(checked);
        setPage(1);
    };

    const toggleShowFilters = () => {
        setShowFilters(!showFilters)
    }

    const containerRef = useRef<HTMLDivElement>(null);
    useFormEnterNavigation({
        containerRef: containerRef,
        excludeSelectors: [
            '.editable-cell-input',
            '[data-table-cell="true"]',
            '[name="btn-chvron-right"]',
            '[name="switch-change-mode"]',
            '[name="switch-change-mode-btn"]',
        ],
        enabled: true,
    })

    useCommands({
    'searchFilters.focusSearch':handleManualSearch,
    'forms.reset':handleResetFilters
    })

    return (
        <main ref={containerRef} className="h-full p-2 gap-2 flex flex-col">
            <header className="bg-card rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
                <h1 className="text-lg font-bold text-primary">Cotizaciones</h1>
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
                        {/* Toggle de modo de búsqueda */}
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
                                onClick={handleRefetchQuotations}
                                buttonProps={{
                                    className: 'w-8',
                                    disabled: isRefetchingQuotations || isFetching,
                                }}
                                tooltip={config?.features?.refreshButton?.description || "Recargar cotizaciónes"}
                            >
                                <RefreshCcw className={`size-4 ${isRefetchingQuotations || isFetching ? 'animate-spin' : ''}`} />
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
                            <QuotationsFiltersComponent
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
                <QuotationsListTable
                    data={quotationData || { data: [], meta: null, links: null }}
                    filters={filters}
                    isError={isError}
                    isFetching={isFetching}
                    isInfiniteScroll={isInfiniteScroll}
                    isLoading={isLoading}
                    quotations={quotations}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    handleDeleteSale={handleOpenDeleteAlert}
                />
            </div>
            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar cotización"
                message={`¿Estás seguro de que deseas eliminar la cotización #${quotationToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main>
    );
}

export default QuotationListScreen;