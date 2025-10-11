import { useNavigate, useParams } from "react-router";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { useMemo } from "react";
import TooltipButton from "@/components/common/TooltipButton";
import { Kbd } from "@/components/atoms/kbd";
import { Building2, Calendar, CornerUpLeft, Edit, FileText, Loader2, MapPin, Trash2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { formatCurrency, formatDate } from "@/utils/formaters";
import { Badge } from "@/components/atoms/badge";
import { formatCell } from "@/utils/formatCell";
import { useHotkeys } from "react-hotkeys-hook";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import ConfirmationModal from "@/components/common/confirmationModal";
import { useGetOrderById } from "../hooks/useGetOrderById";
import { useDeleteOrder } from "../hooks/useDeleteOrder";
import SaleDetailSkeleton from "@/modules/sales/components/saleDetail/saleDetailSkeleton";
import OrderDetailProductsSection from "../components/orderDetail/OrderDetailProductsSection";

const OrderDetailScreen = () => {
    const navigate = useNavigate()
    const { id: orderId } = useParams()

    const {
        data: orderData,
        isLoading: isLoadingOrder,
        isError: isErrorOrder
    } = useGetOrderById(Number(orderId))

    const handleDeleteSuccess = (_data: unknown, orderId: number) => {
        showSuccessToast({
            title: "Pedido eliminado",
            description: `El pedido #${orderId} se eliminó exitosamente`,
            duration: 5000
        })
        handleGoBack()
    };

    const handleDeleteError = (_error: unknown, orderId: number) => {
        showErrorToast({
            title: "Error al eliminar el pedido",
            description: `No se pudo eliminar el pedido #${orderId}. Por favor, intenta nuevamente`,
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

    const totalOrder = useMemo(() => {
        if (!orderData?.detalles) return 0;

        return orderData.detalles.reduce((total, detalle) => {
            const subtotal = detalle.costo * detalle.cantidad;

            return total + subtotal
        }, 0);
    }, [orderData?.detalles]);


    const handleGoBack = () => {
        navigate('/dashboard/orders')
    }

    const handleUpdateOrder = () => {
        navigate(`/dashboard/orders/${orderData?.id}/update`)
    }

    // Shortcuts
    useHotkeys('escape', handleGoBack, {
        scopes: ["esc-key"],
        enabled: true
    });

    if (isLoadingOrder) {
        return <SaleDetailSkeleton />;
    }

    if (isErrorOrder || !(Number(orderId))) {
        return <ErrorDataComponent
            errorMessage="No se pudo cargar el pedido."
            showButtonIcon={false}
            buttonText="Ir a lista de pedidos"
            onRetry={() => navigate("/dashboard/orders")}
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
                                tooltip={<p className="flex gap-1">Presiona <Kbd>esc</Kbd> para volver a la lista de pedidos</p>}
                                buttonProps={{
                                    variant: 'default',
                                }}
                            >
                                <CornerUpLeft />
                            </TooltipButton>
                            <div>
                                <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                                    Pedido {orderData?.nro}
                                </h1>
                                {orderData && (
                                    <p className="text-xs text-muted-foreground">
                                        {orderData.proveedor ? `${orderData.proveedor.proveedor} • ` : ''}
                                        {orderData.cantidad_detalles} {orderData.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                    </p>
                                )}
                            </div>
                        </div >

                        {/* Action Buttons */}
                        < div className="flex items-center gap-2" >
                            <TooltipButton
                                onClick={handleUpdateOrder}
                                tooltip="Editar Pedido"
                                buttonProps={{
                                    variant: 'outline',
                                    size: 'sm'
                                }}
                            >
                                <Edit className="h-4 w-4" />
                                Editar
                            </TooltipButton>

                            <TooltipButton
                                onClick={() => handleOpenDeleteAlert(orderData?.id)}
                                tooltip="Eliminar Pedido"
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Card className="bg-white border border-gray-200 shadow-none md:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <FileText className="size-4 text-gray-700" />
                                Información General
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-base font-semibold text-gray-900">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Número de Pedido</Label>
                                    <p className="font-bold text-sm">{orderData?.nro}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Fecha</Label>
                                    <p className="font-semibold flex items-center gap-2 text-sm">
                                        <Calendar className="size-4 text-gray-600" />
                                        {formatDate(orderData?.fecha ?? '')}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Tipo de pedido</Label>
                                    <br />
                                    <Badge
                                        variant={'secondary'}
                                        className="rounded w-max"
                                    >
                                        {orderData?.tipo_pedido}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Forma de pedido</Label>
                                    <br />
                                    <Badge variant="secondary" className="rounded w-max">
                                        {orderData?.forma_pedido}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Productos</Label>
                                    <br />
                                    <p className="text-sm">
                                        {orderData?.cantidad_detalles}{' '}
                                        {orderData?.cantidad_detalles === 1 ? 'producto' : 'productos'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Comprobante</Label>
                                    <p className="text-sm font-medium">{orderData?.comprobante || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100  border-emerald-200">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold text-emerald-700">Total del Pedido</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                            <p className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(totalOrder)}
                            </p>
                            <p className="text-sm font-medium text-emerald-600/70 mt-1">
                                {orderData?.cantidad_detalles} {orderData?.cantidad_detalles === 1 ? 'producto' : 'productos'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-2">
                    <Card className="bg-white border border-gray-200 shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <Building2 className="size-4 text-gray-700" />
                                Información del Proveedor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-gray-900 space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Proveedor</Label>
                                    <p className="text-sm text-primary font-semibold">{orderData?.proveedor.proveedor}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Contacto</Label>
                                        <p>{formatCell(orderData?.proveedor.contacto)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">NIT</Label>
                                        <p>{formatCell(orderData?.proveedor.nit)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-3.5 text-gray-400" />
                                    <p>{formatCell(orderData?.proveedor?.direccion)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border border-gray-200 shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <User className="size-4 text-gray-700" />
                                Responsable de pedido
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-gray-900 space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Nombre</Label>
                                    <p className="text-base font-semibold">
                                        {[
                                            orderData?.responsable?.nombre,
                                            orderData?.responsable?.apellido_paterno,
                                            orderData?.responsable?.apellido_materno
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">DNI</Label>
                                        <p>{formatCell(orderData?.responsable?.dni)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Celular</Label>
                                        <p>{formatCell(orderData?.responsable?.celular)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <OrderDetailProductsSection
                    products={orderData?.detalles ?? []}
                    isLoading={isLoadingOrder}
                    totalAmount={totalOrder}
                />
            </div >

            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar pedido"
                message={`¿Estás seguro de que deseas eliminar el pedido #${orderToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </main >
    );
}

export default OrderDetailScreen;