import { useNavigate, useParams } from "react-router";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { useMemo } from "react";
import TooltipButton from "@/components/common/TooltipButton";
import { Kbd } from "@/components/atoms/kbd";
import { Calendar, CornerUpLeft, Edit, FileText, Loader2, Trash2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { formatCurrency, formatDate } from "@/utils/formaters";
import { Badge } from "@/components/atoms/badge";
import { formatCell } from "@/utils/formatCell";
import { useHotkeys } from "react-hotkeys-hook";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import ConfirmationModal from "@/components/common/confirmationModal";
import { useGetReturnById } from "../hooks/useGetReturnById";
import { useDeleteReturn } from "../hooks/useDeleteReturn";
import ReturnDetailProductsSection from "../components/returnDetail/ReturnDetailProductsSection";
import ReturnDetailSkeleton from "../components/returnDetail/returnDetailSkeleton";

const ReturnDetailScreen = () => {
    const navigate = useNavigate()
    const { id: returnId } = useParams()

    const {
        data: returnData,
        isLoading: isLoadingReturn,
        isError: isErrorReturn
    } = useGetReturnById(Number(returnId))

    const handleDeleteSuccess = (_data: unknown, returnId: number) => {
        showSuccessToast({
            title: "Devolución eliminada",
            description: `La devolución #${returnId} se eliminó exitosamente`,
            duration: 5000
        })
        handleGoBack()
    };

    const handleDeleteError = (_error: unknown, returnId: number) => {
        showErrorToast({
            title: "Error al eliminar la devolución",
            description: `No se pudo eliminar la devolución #${returnId}. Por favor, intenta nuevamente`,
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

    const totalReturn = useMemo(() => {
        if (!returnData?.detalles) return 0;

        return returnData.detalles.reduce((total, detalle) => {
            const subtotal = (detalle.costo ?? 0) * detalle.cantidad;

            return total + subtotal
        }, 0);
    }, [returnData?.detalles]);


    const handleGoBack = () => {
        navigate('/dashboard/returns')
    }

    const handleUpdateReturn = () => {
        navigate(`/dashboard/returns/${returnData?.id}/update`)
    }

    // Shortcuts
    useHotkeys('escape', handleGoBack, {
        scopes: ["esc-key"],
        enabled: true
    });

    if (isLoadingReturn) {
        return <ReturnDetailSkeleton />;
    }

    if (isErrorReturn || !(Number(returnId))) {
        return <ErrorDataComponent
            errorMessage="No se pudo cargar la devolución."
            showButtonIcon={false}
            buttonText="Ir a lista de devoluciones"
            onRetry={() => navigate("/dashboard/returns")}
        />;
    }

    return (
        <main className="flex flex-col items-center">
            <div className="max-w-7xl w-full space-y-2">
                <header className="border-gray-200 border bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TooltipButton
                                tooltipContentProps={{
                                    align: 'start'
                                }}
                                onClick={handleGoBack}
                                tooltip={<p className="flex gap-1">Presiona <Kbd>esc</Kbd> para volver a la lista de devoluciones</p>}
                                buttonProps={{
                                    variant: 'default',
                                }}
                            >
                                <CornerUpLeft />
                            </TooltipButton>
                            <div>
                                <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                                    Devolución Nro. {returnData?.nro}
                                </h1>
                                {returnData && (
                                    <p className="text-xs text-muted-foreground">
                                        {returnData.cantidad_detalles} {returnData.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                    </p>
                                )}
                            </div>
                        </div >

                        {/* Action Buttons */}
                        < div className="flex items-center gap-2" >
                            <TooltipButton
                                onClick={handleUpdateReturn}
                                tooltip="Editar Devolución"
                                buttonProps={{
                                    variant: 'outline',
                                    size: 'sm'
                                }}
                            >
                                <Edit className="h-4 w-4" />
                                Editar
                            </TooltipButton>

                            <TooltipButton
                                onClick={() => handleOpenDeleteAlert(returnData?.id)}
                                tooltip="Eliminar Devolución"
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Card className="bg-white border border-gray-200 shadow-none md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <FileText className="size-4 text-gray-700" />
                                Información General
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-base font-semibold text-gray-900">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Fecha</Label>
                                    <p className="font-semibold flex items-center gap-2 text-sm">
                                        <Calendar className="size-4 text-gray-600" />
                                        {formatDate(returnData?.fecha ?? '')}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Forma de devolución</Label>
                                    <br />
                                    <Badge
                                        variant={'secondary'}
                                        className="rounded w-max"
                                    >
                                        {returnData?.forma_devolucion}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Total</Label>
                                    <p className="font-bold text-sm text-green-600">{formatCurrency(totalReturn)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Productos</Label>
                                    <br />
                                    <p className="text-sm">
                                        {returnData?.cantidad_detalles}{' '}
                                        {returnData?.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Comprobante</Label>
                                    <p className="text-sm font-medium">{formatCell(returnData?.comprobante)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Comentarios</Label>
                                    <p className="text-sm font-medium">{formatCell(returnData?.comentarios)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100  border-emerald-200">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold text-emerald-700">Total de la devolución</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                            <p className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(totalReturn)}
                            </p>
                            <p className="text-sm font-medium text-emerald-600/70 mt-1">
                                {returnData?.cantidad_detalles} {returnData?.cantidad_detalles === 1 ? 'producto' : 'productos'}
                            </p>
                        </CardContent>
                    </Card> */}

                    <Card className="bg-white border border-gray-200 shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <User className="size-4 text-gray-700" />
                                Responsable de devolución
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-gray-900 space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Nombre</Label>
                                    <p className="text-base font-semibold">
                                        {formatCell(
                                            [
                                                returnData?.responsable?.nombre,
                                                returnData?.responsable?.apellido_paterno,
                                                returnData?.responsable?.apellido_materno
                                            ]
                                                .filter(Boolean)
                                                .join(" ")
                                        )}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">DNI</Label>
                                        <p>{formatCell(returnData?.responsable?.dni)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Celular</Label>
                                        <p>{formatCell(returnData?.responsable?.celular)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <ReturnDetailProductsSection
                    products={returnData?.detalles ?? []}
                    isLoading={isLoadingReturn}
                    totalAmount={totalReturn}
                />
            </div >

            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar devolución"
                message={`¿Estás seguro de que deseas eliminar la devolución #${returnToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main >
    );
}

export default ReturnDetailScreen;