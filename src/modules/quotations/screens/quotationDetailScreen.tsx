import { useNavigate, useParams } from "react-router";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { useMemo, useState } from "react";
import TooltipButton from "@/components/common/TooltipButton";
import { Kbd } from "@/components/atoms/kbd";
import { Building2, Calendar, CornerUpLeft, Edit, FileText, Loader2, MapPin, Phone, Printer, Trash2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { formatCurrency, formatDate } from "@/utils/formaters";
import { Badge } from "@/components/atoms/badge";
import { formatCell } from "@/utils/formatCell";
import { useHotkeys } from "react-hotkeys-hook";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import ConfirmationModal from "@/components/common/confirmationModal";
import { useQuotationGetById } from "../hooks/useQuotationGetById";
import { useDeleteQuotation } from "../hooks/useDeleteQuotation";
import SaleDetailSkeleton from "@/modules/sales/components/saleDetail/saleDetailSkeleton";
import QuotationProductsSection from "../components/quotationDetail/SaleProductsSection";
import { PDFViewer } from "../../../components/common/PDFViewer";
import { useQuotationPDF } from "../hooks/useQuotationPDF";

const QuotationDetailScreen = () => {
    const navigate = useNavigate()
    const { id: quotationId } = useParams()
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

    const {
        data: quotationData,
        isLoading: isLoadingQuotation,
        isError: isErrorQuotation
    } = useQuotationGetById(Number(quotationId))

    const {
        data: pdfBlob,
        isLoading: isLoadingPdf,
        isError: isErrorPdf,
    } = useQuotationPDF(Number(quotationId), isDialogOpen && !!quotationId);

    const handleDeleteSuccess = (_data: unknown, quotationId: number) => {
        showSuccessToast({
            title: "Cotizacion eliminada",
            description: `La cotizacion #${quotationId} se eliminó exitosamente`,
            duration: 5000
        })
        handleGoBack()
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

    const getContextColor = (tipo: string) => {
        if (tipo === 'VC') return 'warning'; // Credito
        if (tipo === 'V') return 'success'; // Pagado
        return 'secondary';
    };

    const totalQuotation = useMemo(() => {
        if (!quotationData?.detalles) return 0;

        return quotationData.detalles.reduce((total, detalle) => {
            const subtotal = detalle.precio * detalle.cantidad;
            const descuento =
                detalle.porcentaje_descuento != null
                    ? (1 - detalle.porcentaje_descuento / 100)
                    : 1;

            return total + subtotal * descuento;
        }, 0);
    }, [quotationData?.detalles]);


    const handleGoBack = () => {
        navigate('/dashboard/quotations')
    }

    const handleUpdateQuotation = () => {
        navigate(`/dashboard/quotations/${quotationData?.id}/update`)
    }

    const handleOpenPrintDialog = () => {
        setIsDialogOpen(true)
    }

    const handleClosePrintDialog = () => {
        setIsDialogOpen(false)
    }

    // Shortcuts
    useHotkeys('escape', handleGoBack, {
        scopes: ["esc-key"],
        enabled: true
    });

    if (isLoadingQuotation) {
        return <SaleDetailSkeleton />;
    }

    if (isErrorQuotation || !(Number(quotationId))) {
        return <ErrorDataComponent
            errorMessage="No se pudo cargar la cotización."
            showButtonIcon={false}
            buttonText="Ir a lista de cotizaciones"
            onRetry={() => navigate("/dashboard/quotations")}
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
                                tooltip={<p className="flex gap-1">Presiona <Kbd>esc</Kbd> para volver a la lista de cotizaciones</p>}
                                buttonProps={{
                                    variant: 'default',
                                }}
                            >
                                <CornerUpLeft />
                            </TooltipButton>
                            <div>
                                <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                                    Cotizacion {quotationData?.nro}
                                </h1>
                                {quotationData && (
                                    <p className="text-sm text-gray-600">
                                        {quotationData.cliente ? `${quotationData.cliente?.cliente} - ` : ''}
                                        {quotationData.cantidad_detalles} {quotationData.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                    </p>
                                )}
                            </div>
                        </div >

                        {/* Action Buttons */}
                        < div className="flex items-center gap-2" >
                            <TooltipButton
                                onClick={handleUpdateQuotation}
                                tooltip="Editar cotizacion"
                                buttonProps={{
                                    variant: 'outline',
                                    size: 'sm'
                                }}
                            >
                                <Edit className="h-4 w-4" />
                                Editar
                            </TooltipButton>

                            <TooltipButton
                                onClick={handleOpenPrintDialog}
                                tooltip="Imprimir cotizacion"
                                buttonProps={{
                                    variant: 'default',
                                }}
                            >
                                <Printer className="h-4 w-4" />
                                Imprimir
                            </TooltipButton>

                            <TooltipButton
                                onClick={() => handleOpenDeleteAlert(quotationData?.id)}
                                tooltip="Eliminar cotizacion"
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
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                            <FileText className="h-5 w-5 text-gray-700" />
                            Información General
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-base font-semibold text-gray-900">
                            <div>
                                <Label>Número de cotizacion</Label>
                                <p className="font-bold">{quotationData?.nro}</p>
                            </div>
                            <div>
                                <Label>Fecha</Label>
                                <p className="font-semibold flex items-center gap-2">
                                    <Calendar className="size-4 text-gray-600" />
                                    {formatDate(quotationData?.fecha ?? '')}
                                </p>
                            </div>
                            <div>
                                <Label>Total</Label>
                                <br />
                                <Badge
                                    className="rounded font-bold text-base"
                                    variant={'success'}>
                                    {formatCurrency(totalQuotation)}
                                </Badge>
                            </div>
                            <div>
                                <Label>Tipo de cotizacion</Label>
                                <br />
                                <Badge
                                    variant={getContextColor(quotationData?.tipo_cotizacion ?? '')}
                                    className="rounded w-max"
                                >
                                    {quotationData?.tipo_cotizacion}
                                </Badge>
                            </div>
                            <div>
                                <Label>Forma de cotizacion</Label>
                                <br />
                                <Badge variant="secondary" className="rounded w-max">
                                    {quotationData?.forma_cotizacion}
                                </Badge>
                            </div>
                            <div>
                                <Label>Productos</Label>
                                <br />
                                <p className="text-base">
                                    {quotationData?.cantidad_detalles}{' '}
                                    {quotationData?.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-2">
                    <Card className="bg-white border border-gray-200 shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                                <Building2 className="h-5 w-5 text-gray-700" />
                                Información del cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-gray-900 space-y-4">
                                <div>
                                    <Label>Cliente</Label>
                                    <p className="text-base text-blue-600 font-semibold">{quotationData?.cliente?.cliente}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label>Contacto</Label>
                                        <p>{formatCell(quotationData?.cliente?.contacto)}</p>
                                    </div>
                                    <div>
                                        <Label>NIT</Label>
                                        <p>{formatCell(quotationData?.cliente?.nit)}</p>
                                    </div>
                                </div>
                                {
                                    quotationData?.cliente_telefono && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="size-3.5 text-gray-400" />
                                            <p>{formatCell(quotationData?.cliente_telefono)}</p>
                                        </div>
                                    )
                                }
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-3.5 text-gray-400" />
                                    <p>{formatCell(quotationData?.cliente?.direccion)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200 shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                                <User className="h-5 w-5 text-gray-700" />
                                Responsable de cotizacion
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-gray-900 space-y-4">
                                <div>
                                    <Label>Nombre</Label>
                                    <p className="text-base font-semibold">
                                        {[
                                            quotationData?.responsable_cotizacion?.nombre,
                                            quotationData?.responsable_cotizacion?.apellido_paterno,
                                            quotationData?.responsable_cotizacion?.apellido_materno
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label>DNI</Label>
                                        <p>{formatCell(quotationData?.responsable_cotizacion?.dni)}</p>
                                    </div>
                                    <div>
                                        <Label>Celular</Label>
                                        <p>{formatCell(quotationData?.responsable_cotizacion?.celular)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <QuotationProductsSection
                    products={quotationData?.detalles ?? []}
                    isLoading={isLoadingQuotation}
                    totalAmount={totalQuotation}
                />
            </div >

            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar cotizacion"
                message={`¿Estás seguro de que deseas eliminar la cotizacion #${quotationToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
            {/* Modal PDF Viewer */}
            <PDFViewer
                id={Number(quotationId)}
                pdfBlob={pdfBlob}
                isLoading={isLoadingPdf}
                isError={isErrorPdf}
                onClose={handleClosePrintDialog}
                isOpen={isDialogOpen}
                pdfName="cotizacion"
                title={`Cotizacion Nro. ${quotationData?.id}`}
            />
        </main >
    );
}

export default QuotationDetailScreen;