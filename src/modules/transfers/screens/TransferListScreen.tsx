import { useBranchStore } from "@/states/branchStore";
import { useEffect, useState } from "react";
import { Filter, RefreshCcw, Search } from "lucide-react";
import { Input } from "@/components/atoms/input";
import { useDebounce } from "use-debounce";
import { Switch } from "@/components/atoms/switch";
import { Label } from "@/components/atoms/label";
import TooltipButton from "@/components/common/TooltipButton";
import { Button } from "@/components/atoms/button";
import { Separator } from "@/components/atoms/separator";
import ConfirmationModal from "@/components/common/confirmationModal";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import type { TransferGetAll } from "../types/transferGet.types";
import { useTransfersFilters } from "../hooks/useTransfersFilters";
import { useTransfersGetAll } from "../hooks/useTransfersGetAll";
import { useDeleteTransfer } from "../hooks/useDeleteTransfer";
import TransferFiltersComponent from "../components/transferList/TransferFiltersComponent";
import TransferListTable from "../components/transferList/TransferListTable";

const TransferListScreen = () => {
    const { selectedBranchId } = useBranchStore()
    const [searchKeywords, setSearchKeywords] = useState("");
    const [debouncedSearchKeywords] = useDebounce(searchKeywords, 500);
    const [isInfiniteScroll, setIsInfiniteScroll] = useState<boolean>(false)
    const [showFilters, setShowFilters] = useState<boolean>(true)
    const [transfers, setTransfers] = useState<TransferGetAll[]>([]);
    const [searchMode] = useState<'realtime' | 'manual'>('realtime');

    const {
        filters,
        debouncedFilters,
        appliedFilters,
        updateFilter,
        setPage,
        resetFilters,
        setPageSize
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
        setSearchKeywords("")
    }

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
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: transferToDelete
    } = useConfirmMutation(deleteTransfer, handleDeleteSuccess, handleDeleteError)

    useEffect(() => {
        updateFilter("keywords", debouncedSearchKeywords);
    }, [debouncedSearchKeywords, updateFilter]);

    const handleRefetchTransfers = () => {
        refetchTransfers();
    }

    const toggleShowFilters = () => {
        setShowFilters(!showFilters)
    }

    return (
        <main className="min-h-screen space-y-2">
            <header className="bg-white rounded-lg p-2 space-y-2 border border-gray-200">
                <h1 className="text-lg font-bold text-gray-900">Transferencias</h1>
                <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
                    <div className="flex items-center gap-2 md:gap-4 grow">

                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Buscar por palabras clave..."
                                value={searchKeywords}
                                onChange={(e) => setSearchKeywords(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
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

                        <Button variant="outline" size="sm" onClick={handleResetFilters}>
                            <Filter className="h-4 w-4" />
                            Limpiar Filtros
                        </Button>
                        <Button size={'sm'} onClick={toggleShowFilters}>
                            {
                                showFilters ?
                                    "Ocultar filtros" :
                                    "Mostrar filtros"
                            }
                        </Button>
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
                            />
                        </>
                    )
                }
            </header>

            <div className="bg-white rounded-lg border border-gray-200 space-y-2">
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
                />
            </div>
            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar Transferencia"
                message={`¿Estás seguro de que deseas eliminar la Transferencia #${transferToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main>
    );
}

export default TransferListScreen;