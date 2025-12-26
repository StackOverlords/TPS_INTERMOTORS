import { useBranchStore } from "@/states/branchStore";
import { useEffect, useState } from "react";
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
import type { OrderGetAll } from "../types/orderGet.types";
import { useOrdersFilters } from "../hooks/useOrdersFilters";
import { useOrdersGetAll } from "../hooks/useOrdersGetAll";
import { useDeleteOrder } from "../hooks/useDeleteOrder";
import OrdersFiltersComponent from "../components/orderList/orderFilterComponent";
import OrdersListTable from "../components/orderList/orderListTable";
import { useViewConfig } from "@/hooks/useViewConfig";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { useCommands } from "@/keybindings";

const OrderListScreen = () => {
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId)
    const {
        config,
        isFeatureEnabled,
        getBehaviorValue,
    } = useViewConfig('orders-list');

    const [isInfiniteScroll, setIsInfiniteScroll] = useState(
        getBehaviorValue<boolean>('infiniteScroll') ?? false
    );
    const [showFilters, setShowFilters] = useState(
        getBehaviorValue<boolean>('showFiltersOnMount') ?? true
    );
    const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>(
        getBehaviorValue<'realtime' | 'manual'>('defaultSearchMode') ?? 'manual'
    );
    const [orders, setOrders] = useState<OrderGetAll[]>([]);

    const {
        filters,
        debouncedFilters,
        appliedFilters,
        updateFilter,
        setPage,
        resetFilters,
        applyFilters,
        setPageSize,
    } = useOrdersFilters(Number(selectedBranchId) || 1)

    // Determinar qué filtros usar según el modo
    const activeFilters = searchMode === 'realtime' ? debouncedFilters : appliedFilters;

    const {
        data: orderData,
        isLoading,
        error,
        isFetching,
        isError,
        refetch: refetchOrders,
        isRefetching: isRefetchingOrders,
    } = useOrdersGetAll(activeFilters)

    useEffect(() => {
        if (!orderData?.data || error || isFetching) return;

        if (isInfiniteScroll && filters.pagina && filters.pagina > 1) {
            setOrders((prev) => {
                // Evitar duplicados
                const newOrders = orderData.data.filter(
                    newOrder => !prev.some(existingOrder => existingOrder.id === newOrder.id)
                );
                return [...prev, ...newOrders];
            });
        } else {
            setOrders(orderData.data);
        }
    }, [orderData?.data, isInfiniteScroll, filters.pagina, error, isFetching]);

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
            title: "Pedido eliminado",
            description: `El Pedido #${Id} se eliminó exitosamente`,
            duration: 5000
        })
    };

    const handleDeleteError = (_error: unknown, Id: number) => {
        showErrorToast({
            title: "Error al eliminar Pedido",
            description: `No se pudo eliminar el Pedido #${Id}. Por favor, intenta nuevamente`,
            duration: 5000
        })
    };

    const {
        mutate: deleteOrder,
        isPending: isDeleting
    } = useDeleteOrder()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: orderToDelete
    } = useConfirmMutation(deleteOrder, handleDeleteSuccess, handleDeleteError)

    const handleRefetchOrders = () => {
        refetchOrders();
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
        'searchFilters.focusSearch':handleManualSearch,
        'forms.reset':handleResetFilters
    },{
        enabled: true,
        enableOnFormTags: true
    })

    return (
        <main className="h-full p-2 gap-2 flex flex-col">
            <header className="bg-card rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
                <h1 className="text-lg font-bold text-primary">Pedidos</h1>
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
                                onClick={handleRefetchOrders}
                                buttonProps={{
                                    className: 'w-8',
                                    disabled: isRefetchingOrders || isFetching,
                                }}
                                tooltip={config?.features?.refreshButton?.description || "Recargar devoluciónes"}
                            >
                                <RefreshCcw className={`size-4 ${isRefetchingOrders || isFetching ? 'animate-spin' : ''}`} />
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
                            <OrdersFiltersComponent
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
                <OrdersListTable
                    data={orderData || { data: [], meta: null, links: null }}
                    filters={filters}
                    isError={isError}
                    isFetching={isFetching}
                    isInfiniteScroll={isInfiniteScroll}
                    isLoading={isLoading}
                    orders={orders}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    handleDeleteSale={handleOpenDeleteAlert}
                />
            </div>
            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar Pedido"
                message={`¿Estás seguro de que deseas eliminar el Pedido #${orderToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main>
    );
}

export default OrderListScreen;