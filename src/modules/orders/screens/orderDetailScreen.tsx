import { Badge } from "@/components/atoms/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import ConfirmationModal from "@/components/common/confirmationModal";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import TooltipButton from "@/components/common/TooltipButton";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import useConfirmMutation from "@/hooks/useConfirmMutation";
import SaleDetailSkeleton from "@/modules/sales/components/saleDetail/saleDetailSkeleton";
import { formatDate } from "@/utils/formaters";
import {
  Calendar,
  CornerUpLeft,
  Edit,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams } from "react-router";
import OrderDetailProductsSection from "../components/orderDetail/OrderDetailProductsSection";
import { useDeleteOrder } from "../hooks/useDeleteOrder";
import { useGetOrderById } from "../hooks/useGetOrderById";

const OrderDetailScreen = () => {
  const navigate = useNavigate();
  const { orderCod } = useParams();

  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isErrorOrder,
  } = useGetOrderById(Number(orderCod));

  const handleDeleteSuccess = (_data: unknown, orderId: number) => {
    showSuccessToast({
      title: "Pedido eliminado",
      description: `El pedido #${orderId} se eliminó exitosamente`,
      duration: 5000,
    });
    handleGoBack();
  };

  const handleDeleteError = (_error: unknown, orderId: number) => {
    showErrorToast({
      title: "Error al eliminar el pedido",
      description: `No se pudo eliminar el pedido #${orderId}. Por favor, intenta nuevamente`,
      duration: 5000,
    });
  };

  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();

  const {
    close: handleCloseDeleteAlert,
    confirm: handleConfirmDeleteAlert,
    isOpen: showDeleteAlert,
    open: handleOpenDeleteAlert,
    variables: orderToDelete,
  } = useConfirmMutation(deleteOrder, handleDeleteSuccess, handleDeleteError);

  const totalOrder = useMemo(() => {
    if (!orderData?.detalles) return 0;

    return orderData.detalles.reduce((total, detalle) => {
      const subtotal = detalle.costo * detalle.cantidad;

      return total + subtotal;
    }, 0);
  }, [orderData?.detalles]);

  const handleGoBack = () => {
    navigate("/dashboard/orders");
  };

  const handleUpdateOrder = () => {
    navigate(`/dashboard/orders/${orderData?.id}/update`);
  };

  // Shortcuts
  useHotkeys("escape", handleGoBack, {
    scopes: ["esc-key"],
    enabled: true,
  });

  if (isLoadingOrder) {
    return <SaleDetailSkeleton />;
  }

  if (isErrorOrder || !orderData) {
    return (
      <div className="h-full flex items-center justify-center p-2 lg:p-8">
        <ErrorDataComponent
          className="h-full w-full"
          errorMessage="No se pudo cargar el pedido."
          showButtonIcon={false}
          buttonText="Ir a lista de pedidos"
          onRetry={() => {
            navigate("/dashboard/orders");
          }}
        />
      </div>
    );
  }

  return (
    <main className="h-full flex flex-col items-center overflow-hidden p-2">
      <div className="max-w-max w-full h-full flex flex-col gap-2 overflow-auto">
        <header className="border-border border bg-card rounded-lg py-2 px-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TooltipButton
                tooltipContentProps={{
                  align: "start",
                }}
                onClick={handleGoBack}
                tooltip={
                  <p className="flex gap-1">
                    Presiona <Kbd>esc</Kbd> para volver a la lista de pedidos
                  </p>
                }
                buttonProps={{
                  variant: "default",
                }}
              >
                <CornerUpLeft />
              </TooltipButton>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-foreground leading-tight">
                  Pedido {orderData?.nro}
                </h1>
                {orderData && (
                  <p className="text-xs text-muted-foreground">
                    {orderData.proveedor
                      ? `${orderData.proveedor.proveedor} • `
                      : ""}
                    {orderData.cantidad_detalles}{" "}
                    {orderData.cantidad_detalles === 1
                      ? "producto"
                      : "productos"}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <ProtectedAction
                permission="ped-edit"
                roles={["Super Admin", "Administrador","Vendedor"]}
                fallback={null}
              >
                <TooltipButton
                  onClick={handleUpdateOrder}
                  tooltip="Editar Pedido"
                  buttonProps={{
                    variant: "outline",
                    size: "sm",
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </TooltipButton>
              </ProtectedAction>

              <ProtectedAction
                permission="ped-delete"
                roles={["Super Admin", "Administrador","Vendedor"]}
                fallback={null}
              >
                <TooltipButton
                  onClick={() => handleOpenDeleteAlert(orderData?.id)}
                  tooltip="Eliminar Pedido"
                  buttonProps={{
                    variant: "destructive",
                    size: "sm",
                    disabled: isDeleting,
                  }}
                >
                  {!isDeleting ? (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  )}
                </TooltipButton>
              </ProtectedAction>
            </div>
          </div>
        </header>

        <Card className="bg-card border border-border shadow-none flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="size-4 text-muted-foreground" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Fecha</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  {formatDate(orderData?.fecha ?? "")}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Tipo de pedido
                </Label>
                <br />
                <Badge variant="secondary" className="rounded w-max">
                  {orderData?.tipo_pedido}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Forma de pedido
                </Label>
                <br />
                <Badge variant="secondary" className="rounded w-max">
                  {orderData?.forma_pedido}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Comprobante
                </Label>
                <p className="text-sm font-medium">
                  {orderData?.comprobante || "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Proveedor
                </Label>
                <p className="text-sm font-medium">
                  {orderData?.proveedor?.proveedor}
                </p>
              </div>
              {orderData?.responsable && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Responsable
                  </Label>
                  <p className="text-sm font-medium">
                    {[
                      orderData?.responsable?.nombre,
                      orderData?.responsable?.apellido_paterno,
                      orderData?.responsable?.apellido_materno,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información detallada de proveedor y responsable - Comentado por si se necesita más adelante */}
        {/* <div className="grid md:grid-cols-2 gap-2 flex-shrink-0">
                    <Card className="bg-card border border-border shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <Building2 className="size-4 text-muted-foreground" />
                                Información del Proveedor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-foreground space-y-4">
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

                    <Card className="bg-card border border-border shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <User className="size-4 text-muted-foreground" />
                                Responsable de pedido
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-foreground space-y-4">
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
                </div> */}

        <OrderDetailProductsSection
          products={orderData?.detalles ?? []}
          isLoading={isLoadingOrder}
          totalAmount={totalOrder}
        />
      </div>

      <ConfirmationModal
        isOpen={showDeleteAlert}
        title="Eliminar pedido"
        message={`¿Estás seguro de que deseas eliminar el pedido #${orderToDelete}?`}
        onClose={handleCloseDeleteAlert}
        onConfirm={handleConfirmDeleteAlert}
        isLoading={isDeleting}
      />
    </main>
  );
};

export default OrderDetailScreen;
