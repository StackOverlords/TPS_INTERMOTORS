import { Badge } from "@/components/atoms/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import ConfirmationModal from "@/components/common/confirmationModal";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import TooltipButton from "@/components/common/TooltipButton";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import SaleDetailSkeleton from "@/modules/sales/components/saleDetail/saleDetailSkeleton";
import { formatCurrency, formatDate } from "@/utils/formaters";
import { Calendar, CornerUpLeft, Edit, FileText, Loader2, Printer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams } from "react-router";
import { PDFViewer } from "../../../components/common/PDFViewer";
import QuotationProductsSection from "../components/quotationDetail/SaleProductsSection";
import { useDeleteQuotation } from "../hooks/useDeleteQuotation";
import { useQuotationGetById } from "../hooks/useQuotationGetById";
import { useQuotationPDF } from "../hooks/useQuotationPDF";

const QuotationDetailScreen = () => {
    const navigate = useNavigate()
    const { quotationId } = useParams()
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

    if (isErrorQuotation || !quotationData) {
        return (
            <div className="h-full flex items-center justify-center p-2 lg:p-8">
                <ErrorDataComponent
                    className="h-full w-full"
                    errorMessage="No se pudo cargar la cotización."
                    showButtonIcon={false}
                    buttonText="Ir a lista de cotizaciones"
                    onRetry={() => navigate("/dashboard/quotations")}
                />
            </div>
        )
    }

    return (
        <main className="h-full flex flex-col items-center overflow-hidden p-2">
            <div className="max-w-7xl w-full h-full flex flex-col gap-2 overflow-auto">
                <header className="bg-card border border-border rounded-lg py-2 px-3 flex-shrink-0">
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
                                <h1 className="text-lg font-bold text-primary leading-tight">
                                    Cotizacion Nro. {quotationData?.nro}
                                </h1>
                                {quotationData && (
                                    <p className="text-xs text-muted-foreground">
                                        {quotationData?.cantidad_detalles ?? 0}{' '}
                                        {(quotationData?.cantidad_detalles ?? 0) === 1 ? 'producto' : 'productos'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <ProtectedAction
                                permission="cot-edit"
                                roles={["Super Admin", "Administrador"]}
                                fallback={null}
                            >
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
                            </ProtectedAction>

                            <ProtectedAction
                                permission="cot-view_print"
                                roles={["Super Admin", "Administrador", "Vendedor"]}
                                fallback={null}
                            >
                                <TooltipButton
                                    onClick={handleOpenPrintDialog}
                                    tooltip="Imprimir cotizacion"
                                    buttonProps={{
                                        variant: 'default',
                                        size: 'sm'
                                    }}
                                >
                                    <Printer className="h-4 w-4" />
                                    Imprimir
                                </TooltipButton>
                            </ProtectedAction>

                            <ProtectedAction
                                permission="cot-delete"
                                roles={["Super Admin", "Administrador"]}
                                fallback={null}
                            >
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
                            </ProtectedAction>
                        </div>
                    </div>
                </header>

                <Card className="bg-card border border-border shadow-none flex-shrink-0">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <FileText className="size-4 text-gray-700" />
                            Información General
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                            <div>
                                <Label className="text-xs text-muted-foreground">Fecha</Label>
                                <p className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="size-4 text-gray-600" />
                                    {formatDate(quotationData?.fecha ?? '')}
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Anticipo</Label>
                                <p className="text-sm font-bold text-green-600">{formatCurrency(quotationData?.anticipo)}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Tipo de cotizacion</Label>
                                <br />
                                <Badge
                                    variant={getContextColor(quotationData?.tipo_cotizacion ?? '')}
                                    className="rounded w-max"
                                >
                                    {quotationData?.tipo_cotizacion}
                                </Badge>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Forma de cotizacion</Label>
                                <br />
                                <Badge variant="secondary" className="rounded w-max">
                                    {quotationData?.forma_cotizacion}
                                </Badge>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Cliente</Label>
                                <p className="text-sm font-medium">{quotationData?.cliente?.cliente}</p>
                            </div>
                            {/* <div>
                                <Label className="text-xs text-muted-foreground">Productos</Label>
                                <p className="text-sm">
                                    {quotationData?.cantidad_detalles}{' '}
                                    {quotationData?.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                </p>
                            </div> */}
                            {quotationData?.responsable_cotizacion && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Responsable</Label>
                                    <p className="text-sm font-medium">
                                        {[
                                            quotationData?.responsable_cotizacion?.nombre,
                                            quotationData?.responsable_cotizacion?.apellido_paterno,
                                            quotationData?.responsable_cotizacion?.apellido_materno
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Información detallada de cliente y responsable - Comentado por si se necesita más adelante */}
                {/* <div className="grid md:grid-cols-2 gap-2">
                    <Card className="bg-card border border-border shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-primary">
                                <Building2 className="h-5 w-5 text-gray-700" />
                                Información del cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-primary space-y-4">
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

                    <Card className="bg-card border border-border shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-primary">
                                <User className="h-5 w-5 text-gray-700" />
                                Responsable de cotizacion
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-primary space-y-4">
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
                </div> */}

                <QuotationProductsSection
                    products={quotationData?.detalles ?? []}
                    isLoading={isLoadingQuotation}
                    totalAmount={totalQuotation}
                />
            </div>

            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar cotizacion"
                message={`¿Estás seguro de que deseas eliminar la cotización #${quotationToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
            {/* Modal PDF Viewer */}
            {
                isDialogOpen && (
                    <PDFViewer
                        id={Number(quotationId)}
                        pdfBlob={pdfBlob}
                        isLoading={isLoadingPdf}
                        isError={isErrorPdf}
                        onClose={handleClosePrintDialog}
                        isOpen={isDialogOpen}
                        pdfName="cotizacion"
                        title={`Cotización Nro. ${quotationData?.id}`}
                    />
                )
            }
        </main>
    );
}

export default QuotationDetailScreen;