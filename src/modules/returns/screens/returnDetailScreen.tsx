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
import { useNavigate } from "react-router";
import ReturnDetailProductsSection from "../components/returnDetail/ReturnDetailProductsSection";
import ReturnDetailSkeleton from "../components/returnDetail/returnDetailSkeleton";
import { useDeleteReturn } from "../hooks/useDeleteReturn";
import { useGetReturnById } from "../hooks/useGetReturnById";
import { useValidatedRouteParam } from "@/hooks/useValidatedRouteParam";
import { useViewRenderer } from "@/hooks/useViewRenderer";

const ReturnDetailScreen = () => {
  const navigate = useNavigate();

  const { value: returnCod, isValid: isValidReturnCod } =
    useValidatedRouteParam({
      paramName: "returnCod",
      minValidValue: 1,
    });

  const {
    data: returnData,
    isLoading: isLoadingReturn,
    isError: isErrorReturn,
    refetch: refetchReturn,
  } = useGetReturnById(returnCod ?? 0);

  const { renderView } = useViewRenderer({
    queryStates: [
      {
        isLoading: isLoadingReturn,
        isError: isErrorReturn,
        data: returnData,
      },
    ],
    isValidating: isValidReturnCod, // Pasar la validación externa
    SkeletonComponent: ReturnDetailSkeleton,
    ErrorComponent: ErrorDataComponent,
    errorMessage: "No se pudo cargar la devolución.",
    onRetry: refetchReturn,
  });

  const handleDeleteSuccess = (_data: unknown, returnId: number) => {
    showSuccessToast({
      title: "Devolución eliminada",
      description: `La devolución #${returnId} se eliminó exitosamente`,
      duration: 5000,
    });
    handleGoBack();
  };

  const handleDeleteError = (_error: unknown, returnId: number) => {
    showErrorToast({
      title: "Error al eliminar la devolución",
      description: `No se pudo eliminar la devolución #${returnId}. Por favor, intenta nuevamente`,
      duration: 5000,
    });
  };

  const { mutate: deleteReturn, isPending: isDeleting } = useDeleteReturn();

  const {
    close: handleCloseDeleteAlert,
    confirm: handleConfirmDeleteAlert,
    isOpen: showDeleteAlert,
    open: handleOpenDeleteAlert,
    variables: returnToDelete,
  } = useConfirmMutation(deleteReturn, handleDeleteSuccess, handleDeleteError);

  const totalReturn = useMemo(() => {
    if (!returnData?.detalles) return 0;

    return returnData.detalles.reduce((total, detalle) => {
      const subtotal = (detalle.costo ?? 0) * detalle.cantidad;

      return total + subtotal;
    }, 0);
  }, [returnData?.detalles]);

  const handleGoBack = () => {
    navigate("/dashboard/returns");
  };

  const handleUpdateReturn = () => {
    navigate(`/dashboard/returns/${returnData?.id}/update`);
  };

  // Shortcuts
  useHotkeys("escape", handleGoBack, {
    scopes: ["esc-key"],
    enabled: true,
  });

  const view = renderView();
  if (view) return view;

  return (
    <main className="h-full flex flex-col items-center overflow-hidden p-2">
      <div className="max-w-7xl w-full h-full flex flex-col gap-2 overflow-auto">
        <header className="bg-background border border-border rounded-lg py-2 px-3 flex-shrink-0">
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
                    devoluciones
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
                  Devolución Nro. {returnData?.nro}
                </h1>
                {returnData && (
                  <p className="text-xs text-muted-foreground">
                    {returnData.cantidad_detalles}{" "}
                    {returnData.cantidad_detalles === 1
                      ? "producto"
                      : "productos"}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <ProtectedAction
                permission="dev-edit"
                roles={["Super Admin", "Administrador", "Vendedor"]}
                fallback={null}
              >
                <TooltipButton
                  onClick={handleUpdateReturn}
                  tooltip="Editar Devolución"
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
                permission="dev-delete"
                roles={["Super Admin", "Administrador", "Vendedor"]}
                fallback={null}
              >
                <TooltipButton
                  onClick={() => handleOpenDeleteAlert(returnData?.id)}
                  tooltip="Eliminar Devolución"
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

        <Card className="bg-background border border-border shadow-none flex-shrink-0">
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
                  {formatDate(returnData?.fecha ?? "")}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Forma de devolución
                </Label>
                <br />
                <Badge variant="secondary" className="rounded w-max">
                  {returnData?.forma_devolucion}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Comprobante
                </Label>
                <p className="text-sm font-medium">
                  {formatCell(returnData?.comprobante)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Comentarios
                </Label>
                <p className="text-sm font-medium">
                  {formatCell(returnData?.comentarios)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Responsable
                </Label>
                <p className="text-sm font-medium">
                  {formatCell(
                    [
                      returnData?.responsable?.nombre,
                      returnData?.responsable?.apellido_paterno,
                      returnData?.responsable?.apellido_materno,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información detallada de responsable - Comentado por si se necesita más adelante */}
        {/* <Card className="bg-white border border-gray-200 shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                            <User className="size-4 text-muted-foreground" />
                            Responsable de devolución
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-foreground space-y-4">
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
                </Card> */}

        <ReturnDetailProductsSection
          products={returnData?.detalles ?? []}
          isLoading={isLoadingReturn}
          totalAmount={totalReturn}
        />
      </div>

      <ConfirmationModal
        isOpen={showDeleteAlert}
        title="Eliminar devolución"
        message={`¿Estás seguro de que deseas eliminar la devolución #${returnToDelete}?`}
        onClose={handleCloseDeleteAlert}
        onConfirm={handleConfirmDeleteAlert}
        isLoading={isDeleting}
      />
    </main>
  );
};

export default ReturnDetailScreen;
