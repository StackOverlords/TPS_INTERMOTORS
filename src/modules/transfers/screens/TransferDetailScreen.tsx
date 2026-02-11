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
import { formatCell } from "@/utils/formatCell";
import { formatCurrency, formatDate } from "@/utils/formaters";
import {
  ArrowLeftRight,
  Building2,
  Calendar,
  CornerUpLeft,
  Edit,
  FileText,
  Loader2,
  Trash2,
  User,
} from "lucide-react";
import { useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router";
import TransferDetailProductsSection from "../components/transferDetail/TransferDetailProductsSection";
import TransferDetailSkeleton from "../components/transferDetail/TransferDetailSkeleton";
import { useDeleteTransfer } from "../hooks/useDeleteTransfer";
import { useTransferById } from "../hooks/useTransferById";
import { useValidatedRouteParam } from "@/hooks/useValidatedRouteParam";
import { useViewRenderer } from "@/hooks/useViewRenderer";

const TransferDetailScreen = () => {
  const navigate = useNavigate();

  const { value: transferId, isValid: isValidTransferId } =
    useValidatedRouteParam({
      paramName: "id",
      minValidValue: 1,
    });

  const {
    data: transferData,
    isLoading: isLoadingTransfer,
    isError: isErrorTransfer,
    refetch: refetchTransfer,
  } = useTransferById(transferId ?? 0);

  const { renderView } = useViewRenderer({
    queryStates: [
      {
        isLoading: isLoadingTransfer,
        isError: isErrorTransfer,
        data: transferData,
      },
    ],
    isValidating: isValidTransferId, // Pasar la validación externa
    SkeletonComponent: TransferDetailSkeleton,
    ErrorComponent: ErrorDataComponent,
    errorMessage: "No se pudo cargar la transferencia.",
    onRetry: refetchTransfer,
  });

  const handleDeleteSuccess = (_data: unknown, transferId: number) => {
    showSuccessToast({
      title: "Transferencia eliminada",
      description: `La transferencia #${transferId} se eliminó exitosamente`,
      duration: 5000,
    });
    handleGoBack();
  };

  const handleDeleteError = (_error: unknown, transferId: number) => {
    showErrorToast({
      title: "Error al eliminar la transferencia",
      description: `No se pudo eliminar la transferencia #${transferId}. Por favor, intenta nuevamente`,
      duration: 5000,
    });
  };

  const { mutate: deleteTransfer, isPending: isDeleting } = useDeleteTransfer();

  const {
    close: handleCloseDeleteAlert,
    confirm: handleConfirmDeleteAlert,
    isOpen: showDeleteAlert,
    open: handleOpenDeleteAlert,
    variables: transferToDelete,
  } = useConfirmMutation(
    deleteTransfer,
    handleDeleteSuccess,
    handleDeleteError
  );

  const totalTransfer = useMemo(() => {
    if (!transferData?.detalles) return 0;

    return transferData.detalles.reduce((total, detalle) => {
      const subtotal =
        Number(detalle.costo_entrada ?? 0) * Number(detalle.cantidad ?? 0);

      return total + subtotal;
    }, 0);
  }, [transferData?.detalles]);

  const handleGoBack = () => {
    navigate("/dashboard/transfers");
  };

  const handleUpdateTransfer = () => {
    navigate(`/dashboard/transfers/${transferData?.id}/update`);
  };

  // Shortcuts
  useHotkeys("escape", handleGoBack, {
    scopes: ["esc-key"],
    enabled: true,
  });

  const view = renderView();
  if (view) return view;

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <div className="max-w-7xl w-full h-full flex flex-col gap-2 mx-auto">
        <header className="border-border border bg-background rounded-lg p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TooltipButton
                tooltipContentProps={{
                  align: "start",
                }}
                onClick={handleGoBack}
                tooltip={
                  <p className="flex gap-1">
                    Presiona <Kbd>esc</Kbd> para volver a la lista de
                    transferencias
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
                  Transferencia Nro. {transferData?.nro_completo}
                </h1>
                {transferData && (
                  <p className="text-xs text-muted-foreground">
                    {transferData.cantidad_detalles}{" "}
                    {transferData.cantidad_detalles === 1
                      ? "producto"
                      : "productos"}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <ProtectedAction
                permission="tra-edit"
                roles={["Super Admin", "Administrador", "Vendedor"]}
                fallback={null}
              >
                <TooltipButton
                  onClick={handleUpdateTransfer}
                  tooltip="Editar Transferencia"
                  buttonProps={{
                    variant: "outline",
                    size: "sm",
                    disabled: transferData?.estado
                      .trim()
                      .includes("RECEPCIONADO <=> TRANSFERIDO"),
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </TooltipButton>
              </ProtectedAction>

              <ProtectedAction
                permission="tra-delete"
                roles={["Super Admin", "Administrador", "Vendedor"]}
                fallback={null}
              >
                <TooltipButton
                  onClick={() => handleOpenDeleteAlert(transferData?.id)}
                  tooltip="Eliminar Transferencia"
                  buttonProps={{
                    variant: "destructive",
                    size: "sm",
                    disabled: true,
                    // disabled: isDeleting
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

        {/* Contenedor con scroll interno */}
        <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-2">
          <Card className="bg-background border border-border shadow-none flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="size-4 text-muted-foreground" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-base font-semibold text-foreground">
                <div>
                  <Label className="text-xs text-muted-foreground">Fecha</Label>
                  <p className="font-semibold flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-muted-foreground" />
                    {formatDate(transferData?.fecha ?? "")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Estado
                  </Label>
                  <br />
                  <Badge
                    variant={
                      transferData?.estado === "RECIBIDA"
                        ? "success"
                        : transferData?.estado === "RECHAZADA"
                          ? "destructive"
                          : "warning"
                    }
                    className="rounded w-max"
                  >
                    {transferData?.estado}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total</Label>
                  <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalTransfer)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Productos
                  </Label>
                  <br />
                  <p className="text-sm">
                    {transferData?.cantidad_detalles}{" "}
                    {transferData?.cantidad_detalles === 1
                      ? "producto"
                      : "productos"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Sucursal Origen
                  </Label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Building2 className="size-3 text-muted-foreground" />
                    {formatCell(transferData?.sucursal_origen_nombre)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Sucursal Destino
                  </Label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <ArrowLeftRight className="size-3 text-muted-foreground" />
                    {formatCell(transferData?.sucursal_destino_nombre)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Comprobante
                  </Label>
                  <p className="text-sm font-medium">
                    {formatCell(transferData?.nro_comprobante)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Responsable
                  </Label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <User className="size-3 text-muted-foreground" />
                    {formatCell(
                      [
                        transferData?.responsable?.nombre,
                        transferData?.responsable?.apellido_paterno,
                        transferData?.responsable?.apellido_materno,
                      ]
                        .filter(Boolean)
                        .join(" ")
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Comentarios
                  </Label>
                  <p className="text-sm font-medium">
                    {formatCell(transferData?.comentarios)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <TransferDetailProductsSection
            products={transferData?.detalles ?? []}
            isLoading={isLoadingTransfer}
            totalAmount={totalTransfer}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteAlert}
        title="Eliminar transferencia"
        message={`¿Estás seguro de que deseas eliminar la transferencia #${transferToDelete}?`}
        onClose={handleCloseDeleteAlert}
        onConfirm={handleConfirmDeleteAlert}
        isLoading={isDeleting}
      />
    </main>
  );
};

export default TransferDetailScreen;
