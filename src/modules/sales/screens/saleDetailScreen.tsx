import { Badge } from "@/components/atoms/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import ConfirmationModal from "@/components/common/confirmationModal";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import TooltipButton from "@/components/common/TooltipButton";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import { formatCell } from "@/utils/formatCell";
import { formatDate } from "@/utils/formaters";
import { Building2, Calendar, CornerUpLeft, Edit, FileText, Loader2, Trash2, User } from "lucide-react";
import { useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams } from "react-router";
import SaleDetailSkeleton from "../components/saleDetail/saleDetailSkeleton";
import SaleProductsSection from "../components/saleDetail/SaleProducts";
import { useDeleteSale } from "../hooks/useDeleteSale";
import { useSaleGetById } from "../hooks/useSaleGetById";

const SaleDetailScreen = () => {
    const navigate = useNavigate()
    const { id: saleId } = useParams()

    const {
        data: saleData,
        isLoading: isLoadingSale,
        isError: isErrorSale
    } = useSaleGetById(Number(saleId))

    const handleDeleteSuccess = (_data: unknown, saleId: number) => {
        showSuccessToast({
            title: "Venta eliminada",
            description: `La venta #${saleId} se eliminó exitosamente`,
            duration: 5000
        })
        handleGoBack()
    };

    const handleDeleteError = (_error: unknown, saleId: number) => {
        showErrorToast({
            title: "Error al eliminar venta",
            description: `No se pudo eliminar la venta #${saleId}. Por favor, intenta nuevamente`,
            duration: 5000
        })
    };

    const {
        mutate: deleteSale,
        isPending: isDeleting
    } = useDeleteSale()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: saleToDelete
    } = useConfirmMutation(deleteSale, handleDeleteSuccess, handleDeleteError)

    const getContextColor = (tipo: string) => {
        if (tipo === 'C') return 'warning'; // Credito
        if (tipo === 'P') return 'success'; // Pagado
        return 'secondary';
    };

    const totalVenta = useMemo(() => {
        if (!saleData?.detalles) return 0;

        return saleData.detalles.reduce((total, detalle) => {
            const subtotal = detalle.precio * detalle.cantidad;
            const descuento =
                detalle.porcentaje_descuento != null
                    ? (1 - detalle.porcentaje_descuento / 100)
                    : 1;

            return total + subtotal * descuento;
        }, 0);
    }, [saleData?.detalles]);


    const handleGoBack = () => {
        navigate('/dashboard/sales')
    }

    const handleUpdateSale = () => {
        navigate(`/dashboard/sales/${saleData?.id}/update`)
    }

    // Shortcuts
    useHotkeys('escape', handleGoBack, {
        scopes: ["esc-key"],
        enabled: true
    });

    if (isLoadingSale) {
        return <SaleDetailSkeleton />;
    }

    if (isErrorSale || !(Number(saleId))) {
        return <ErrorDataComponent
            errorMessage="No se pudo cargar la venta."
            showButtonIcon={false}
            buttonText="Ir a lista de ventas"
            onRetry={() => {
                navigate("/dashboard/sales")
            }}
        />
    }

    return (
        <main className="h-full flex flex-col items-center overflow-hidden p-2">
            <div className="max-w-7xl w-full h-full flex flex-col gap-2 overflow-auto">
                <header className="border-gray-200 border bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TooltipButton
                                tooltipContentProps={{
                                    align: 'start'
                                }}
                                onClick={handleGoBack}
                                tooltip={<p className="flex gap-1">Presiona <Kbd>esc</Kbd> para volver a la lista de ventas</p>}
                                buttonProps={{
                                    variant: 'default',
                                }}
                            >
                                <CornerUpLeft />
                            </TooltipButton>
                            <div>
                                <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                                    Venta {saleData?.nro}
                                </h1>
                                {saleData && (
                                    <p className="text-sm text-gray-600">
                                        {saleData.cliente ? `${saleData.cliente?.cliente} - ` : ''}
                                        {saleData.cantidad_detalles} {saleData.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                    </p>
                                )}
                            </div>
                        </div >

                        {/* Action Buttons */}
                        < div className="flex items-center gap-2" >
                            <TooltipButton
                                onClick={handleUpdateSale}
                                tooltip="Editar venta"
                                buttonProps={{
                                    variant: 'outline',
                                    size: 'sm'
                                }}
                            >
                                <Edit className="h-4 w-4" />
                                Editar
                            </TooltipButton>

                            <TooltipButton
                                onClick={() => handleOpenDeleteAlert(saleData?.id)}
                                tooltip="Eliminar venta"
                                buttonProps={{
                                    variant: 'destructive',
                                    size: 'sm',
                                    disabled: isDeleting
                                }}
                            >
                                {
                                    !isDeleting ? (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar
                                        </>
                                    ) : (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Eliminando...
                                        </>
                                    )
                                }
                            </TooltipButton>
                        </div >
                    </div >
                </header >

                <Card className="bg-white border border-gray-200 shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <FileText className="size-4 text-gray-700" />
                            Información General
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-base font-semibold text-gray-900">
                            <div>
                                <Label className="text-xs text-muted-foreground">Fecha</Label>
                                <p className="font-semibold flex items-center gap-2 text-sm">
                                    <Calendar className="size-4 text-gray-600" />
                                    {formatDate(saleData?.fecha ?? '')}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Tipo de venta</Label>
                                <br />
                                <Badge
                                    variant={getContextColor(saleData?.tipo_venta ?? '')}
                                    className="rounded w-max"
                                >
                                    {saleData?.tipo_venta}
                                </Badge>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Forma de venta</Label>
                                <br />
                                <Badge variant="secondary" className="rounded w-max">
                                    {saleData?.forma_venta}
                                </Badge>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Productos</Label>
                                <br />
                                <p className="text-sm">
                                    {saleData?.cantidad_detalles}{' '}
                                    {saleData?.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Cliente</Label>
                                <p className="text-sm font-medium flex items-center gap-1">
                                    <Building2 className="size-3 text-gray-600" />
                                    {formatCell(saleData?.cliente?.cliente)}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Responsable</Label>
                                <p className="text-sm font-medium flex items-center gap-1">
                                    <User className="size-3 text-gray-600" />
                                    {formatCell(
                                        [
                                            saleData?.responsable_venta?.nombre,
                                            saleData?.responsable_venta?.apellido_paterno,
                                            saleData?.responsable_venta?.apellido_materno
                                        ]
                                            .filter(Boolean)
                                            .join(" ")
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <SaleProductsSection
                    products={saleData?.detalles ?? []}
                    isLoading={isLoadingSale}
                    totalAmount={totalVenta}
                />
            </div >

            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar venta"
                message={`¿Estás seguro de que deseas eliminar la venta #${saleToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main >
    );
}

export default SaleDetailScreen;