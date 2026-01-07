import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Separator } from "@/components/atoms/separator";
import { Switch } from "@/components/atoms/switch";
import ConfirmationModal from "@/components/common/confirmationModal";
import TooltipButton from "@/components/common/TooltipButton";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import { useBranchStore } from "@/states/branchStore";
import { Filter, PackageSearch, RefreshCcw, Search, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import TransferFiltersComponent from "../components/transferList/TransferFiltersComponent";
import TransferListTable from "../components/transferList/TransferListTable";
import { useDeleteTransfer } from "../hooks/useDeleteTransfer";
import { useSendTransfer } from "../hooks/useSendTransfer";
import { useAcceptTransfer } from "../hooks/useAcceptTransfer";
import { useRefuseTransfer } from "../hooks/useRefuseTransfer";
import { useTransfersFilters } from "../hooks/useTransfersFilters";
import { useTransfersGetAll } from "../hooks/useTransfersGetAll";
import type { TransferGetAll } from "../types/transferGet.types";
import { useCommands } from "@/keybindings";

const TransferListScreen = () => {
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId)
    const [isInfiniteScroll, setIsInfiniteScroll] = useState<boolean>(false)
    const [showFilters, setShowFilters] = useState<boolean>(true)
    const [transfers, setTransfers] = useState<TransferGetAll[]>([]);
    const [searchMode, setSearchMode] = useState<'realtime' | 'manual'>('manual');

    const {
        filters,
        debouncedFilters,
        appliedFilters,
        updateFilter,
        setPage,
        resetFilters,
        applyFilters,
        setPageSize,
    } = useTransfersFilters(Number(selectedBranchId) || 1)

    // Determinar qué filtros usar según el modo
    const activeFilters = searchMode === 'realtime' ? debouncedFilters : appliedFilters;

    const {
        data: transfersData,
        isLoading,
        error,
        isFetching,
        isError,
        refetch: refetchTransfers,
        isRefetching: isRefetchingTransfers,
    } = useTransfersGetAll(activeFilters)

    useEffect(() => {
        if (!transfersData?.data || error || isFetching) return;

        if (isInfiniteScroll && filters.pagina && filters.pagina > 1) {
            setTransfers((prev) => {
                // Evitar duplicados
                const newTransfers = transfersData.data.filter(
                    (newTransfer: TransferGetAll) => !prev.some(existingTransfer => existingTransfer.id === newTransfer.id)
                );
                return [...prev, ...newTransfers];
            });
        } else {
            setTransfers(transfersData.data);
        }
    }, [transfersData?.data, isInfiniteScroll, filters.pagina, error, isFetching]);

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
            title: "Transferencia eliminada",
            description: `La Transferencia #${Id} se eliminó exitosamente`,
            duration: 5000
        })
    };

    const handleDeleteError = (_error: unknown, Id: number) => {
        showErrorToast({
            title: "Error al eliminar Transferencia",
            description: `No se pudo eliminar la Transferencia #${Id}. Por favor, intenta nuevamente`,
            duration: 5000
        })
    };

    const {
        mutate: deleteTransfer,
        isPending: isDeleting
    } = useDeleteTransfer()

    const {
        mutate: sendTransfer,
        isPending: isSending
    } = useSendTransfer()

    const {
        mutate: acceptTransfer,
        isPending: isAccepting
    } = useAcceptTransfer()

    const {
        mutate: refuseTransfer,
        isPending: isRefusing
    } = useRefuseTransfer()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: transferToDelete
    } = useConfirmMutation(deleteTransfer, handleDeleteSuccess, handleDeleteError)

    const handleSendSuccess = (_data: unknown, Id: number) => {
        showSuccessToast({
            title: "Transferencia enviada",
            description: `La Transferencia #${Id} se envió exitosamente`,
            duration: 5000
        })
    };

    const handleSendError = (_error: unknown, Id: number) => {
        showErrorToast({
            title: "Error al enviar transferencia",
            description: `No se pudo enviar la Transferencia #${Id}. Por favor, intenta nuevamente`,
            duration: 5000
        })
    };

    const {
        close: handleCloseSendAlert,
        confirm: handleConfirmSendAlert,
        isOpen: showSendAlert,
        open: handleOpenSendAlert,
        variables: transferToSend
    } = useConfirmMutation(sendTransfer, handleSendSuccess, handleSendError)

    const handleAcceptSuccess = (_data: unknown, Id: number) => {
        showSuccessToast({
            title: "Transferencia recibida",
            description: `La Transferencia #${Id} se recibió exitosamente`,
            duration: 5000
        })
    };

    const handleAcceptError = (_error: unknown, Id: number) => {
        showErrorToast({
            title: "Error al recibir transferencia",
            description: `No se pudo recibir la Transferencia #${Id}. Por favor, intenta nuevamente`,
            duration: 5000
        })
    };

    const {
        close: handleCloseAcceptAlert,
        confirm: handleConfirmAcceptAlert,
        isOpen: showAcceptAlert,
        open: handleOpenAcceptAlert,
        variables: transferToAccept
    } = useConfirmMutation(acceptTransfer, handleAcceptSuccess, handleAcceptError)

    const handleRefuseSuccess = (_data: unknown, Id: number) => {
        showSuccessToast({
            title: "Transferencia rechazada",
            description: `La Transferencia #${Id} se rechazó exitosamente`,
            duration: 5000
        })
    };

    const handleRefuseError = (_error: unknown, Id: number) => {
        showErrorToast({
            title: "Error al rechazar transferencia",
            description: `No se pudo rechazar la Transferencia #${Id}. Por favor, intenta nuevamente`,
            duration: 5000
        })
    };

    const {
        close: handleCloseRefuseAlert,
        confirm: handleConfirmRefuseAlert,
        isOpen: showRefuseAlert,
        open: handleOpenRefuseAlert,
        variables: transferToRefuse
    } = useConfirmMutation(refuseTransfer, handleRefuseSuccess, handleRefuseError)

    const handleRefetchTransfers = () => {
        refetchTransfers();
    }

    const toggleShowFilters = () => {
        setShowFilters(!showFilters)
    }

    useCommands({
        'searchFilters.focusSearch': handleManualSearch,
        'forms.reset': handleResetFilters
    },{
        enableOnFormTags:true
    })

    return (
        <main className="h-full p-2 gap-2 flex flex-col">
            <header className="bg-card rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
                <h1 className="text-lg font-bold text-primary">Transferencias</h1>
                <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
                    <div className="flex items-center gap-2 md:gap-4 grow">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Buscar por palabras clave..."
                                value={filters.keywords}
                                onChange={(e) => updateFilter("keywords", e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>

                        {/* Botón de búsqueda manual al lado del input */}
                        {searchMode === 'manual' && (
                            <Button
                                onClick={handleManualSearch}
                                size="sm"
                                className="shrink-0"
                            >
                                <Search className="h-4 w-4 mr-2" />
                                Buscar
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Toggle de modo de búsqueda */}
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
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="infinite-scroll"
                                checked={isInfiniteScroll}
                                onCheckedChange={(checked) => {
                                    setIsInfiniteScroll(checked)
                                    setPage(1)
                                }}
                            />
                            <Label htmlFor="infinite-scroll">
                                Scroll Infinito
                            </Label>
                        </div>

                        <TooltipButton
                            onClick={handleRefetchTransfers}
                            buttonProps={{
                                className: 'w-8',
                                disabled: isRefetchingTransfers || isFetching,
                            }}
                            tooltip={"Recargar transferencias"}
                        >
                            <RefreshCcw className={`size-4 ${isRefetchingTransfers || isFetching ? 'animate-spin' : ''}`} />
                        </TooltipButton>

                        <Button onClick={handleResetFilters}>
                            <PackageSearch className="h-4 w-4" />
                            Nueva búsqueda
                        </Button>

                        {/* <Button size={'sm'} onClick={toggleShowFilters}>
                            {
                                showFilters ?
                                    "Ocultar filtros" :
                                    "Mostrar filtros"
                            }
                        </Button> */}
                    </div>
                </section>
                {/* Búsquedas individuales */}
                {
                    showFilters && (
                        <>
                            <Separator />
                            <TransferFiltersComponent
                                filters={filters}
                                updateFilter={updateFilter}
                                handleManualSearch={handleManualSearch}
                                searchMode={searchMode}
                            />
                        </>
                    )
                }
            </header>

            <div className="bg-card rounded-lg border border-border flex-1 overflow-auto">
                <TransferListTable
                    data={transfersData || { data: [], meta: null, links: null }}
                    filters={filters}
                    isError={isError}
                    isFetching={isFetching}
                    isInfiniteScroll={isInfiniteScroll}
                    isLoading={isLoading}
                    transfers={transfers}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    handleDeleteTransfer={handleOpenDeleteAlert}
                    handleSendTransfer={handleOpenSendAlert}
                    handleAcceptTransfer={handleOpenAcceptAlert}
                    handleRefuseTransfer={handleOpenRefuseAlert}
                />
            </div>

            {/* Modal de confirmación para eliminar */}
            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar Transferencia"
                message={`¿Estás seguro de que deseas eliminar la Transferencia #${transferToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />

            {/* Modal de confirmación para enviar */}
            <ConfirmationModal
                isOpen={showSendAlert}
                title="Enviar Transferencia"
                message={`¿Estás seguro de que deseas enviar la Transferencia #${transferToSend}?`}
                onClose={handleCloseSendAlert}
                onConfirm={handleConfirmSendAlert}
                isLoading={isSending}
            />

            {/* Modal de confirmación para recibir */}
            <ConfirmationModal
                isOpen={showAcceptAlert}
                title="Recibir Transferencia"
                message={`¿Estás seguro de que deseas recibir la Transferencia #${transferToAccept}?`}
                onClose={handleCloseAcceptAlert}
                onConfirm={handleConfirmAcceptAlert}
                isLoading={isAccepting}
            />

            {/* Modal de confirmación para rechazar */}
            <ConfirmationModal
                isOpen={showRefuseAlert}
                title="Rechazar Transferencia"
                message={`¿Estás seguro de que deseas rechazar la Transferencia #${transferToRefuse}? Esta acción no se puede deshacer.`}
                onClose={handleCloseRefuseAlert}
                onConfirm={handleConfirmRefuseAlert}
                isLoading={isRefusing}
            />
        </main>
    );
}

export default TransferListScreen;