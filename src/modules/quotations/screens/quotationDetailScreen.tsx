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
import { formatCurrency, formatDate } from "@/utils/formaters";
import {
  Calendar,
  CornerUpLeft,
  Edit,
  FileText,
  Loader2,
  Printer,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router";
import { PDFViewer } from "../../../components/common/PDFViewer";
import QuotationProductsSection from "../components/quotationDetail/SaleProductsSection";
import { useDeleteQuotation } from "../hooks/useDeleteQuotation";
import { useQuotationGetById } from "../hooks/useQuotationGetById";
import { useQuotationPDF } from "../hooks/useQuotationPDF";
import { useValidatedRouteParam } from "@/hooks/useValidatedRouteParam";
import { useViewRenderer } from "@/hooks/useViewRenderer";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import CartModeConversionModal from "@/modules/shoppingCart/components/CartModeConversionModal";
import { useQuotationImport } from "@/modules/shoppingCart/hooks/useQuotationImport";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";

const QuotationDetailScreen = () => {
  const navigate = useNavigate();
  const user = authSDK.getCurrentUser();
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);

  const { value: quotationId, isValid: isValidQuotationId } =
    useValidatedRouteParam({
      paramName: "quotationId",
      minValidValue: 1,
    });

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [showClearCartConfirm, setShowClearCartConfirm] =
    useState<boolean>(false);
  const { navigateWithTab } = useTabNavigation();

  const {
    data: quotationData,
    isLoading: isLoadingQuotation,
    isError: isErrorQuotation,
    refetch: refetchQuotation,
  } = useQuotationGetById(quotationId ?? 0);

  const {
    data: pdfBlob,
    isLoading: isLoadingPdf,
    isError: isErrorPdf,
  } = useQuotationPDF(quotationId ?? 0, isDialogOpen && !!quotationId);

  const cartUtils = useCartWithUtils(user?.name ?? "", selectedBranchId ?? "");

  const {
    isImporting,
    showConversionModal,
    importQuotation,
    confirmConversion,
    cancelConversion,
    previewData,
  } = useQuotationImport({
    onImportComplete: () => {
      navigateWithTab("/dashboard/create-sale", {
        displayCode: "Nueva Venta",
      });
    },
  });

  const { renderView } = useViewRenderer({
    queryStates: [
      {
        isLoading: isLoadingQuotation,
        isError: isErrorQuotation,
        data: quotationData,
      },
    ],
    isValidating: isValidQuotationId,
    SkeletonComponent: SaleDetailSkeleton,
    ErrorComponent: ErrorDataComponent,
    errorMessage: "No se pudo cargar la cotización.",
    onRetry: refetchQuotation,
  });

  const handleDeleteSuccess = (_data: unknown, quotationId: number) => {
    showSuccessToast({
      title: "Cotizacion eliminada",
      description: `La cotizacion #${quotationId} se eliminó exitosamente`,
      duration: 5000,
    });
    handleGoBack();
  };

  const handleDeleteError = (_error: unknown, quotationId: number) => {
    showErrorToast({
      title: "Error al eliminar cotizacion",
      description: `No se pudo eliminar la cotizacion #${quotationId}. Por favor, intenta nuevamente`,
      duration: 5000,
    });
  };

  const { mutate: deleteQuotation, isPending: isDeleting } =
    useDeleteQuotation();

  const {
    close: handleCloseDeleteAlert,
    confirm: handleConfirmDeleteAlert,
    isOpen: showDeleteAlert,
    open: handleOpenDeleteAlert,
    variables: quotationToDelete,
  } = useConfirmMutation(
    deleteQuotation,
    handleDeleteSuccess,
    handleDeleteError
  );

  const getContextColor = (tipo: string) => {
    if (tipo === "VC") return "warning";
    if (tipo === "V") return "success";
    return "secondary";
  };

  const totalQuotation = useMemo(() => {
    if (!quotationData?.detalles) return 0;

    return quotationData.detalles.reduce((total, detalle) => {
      const subtotal = detalle.precio * detalle.cantidad;
      const descuento =
        detalle.porcentaje_descuento != null
          ? 1 - detalle.porcentaje_descuento / 100
          : 1;

      return total + subtotal * descuento;
    }, 0);
  }, [quotationData?.detalles]);

  const handleGoBack = () => {
    navigate("/dashboard/quotations");
  };

  const handleUpdateQuotation = () => {
    navigate(`/dashboard/quotations/${quotationData?.id}/update`);
  };

  const handleOpenPrintDialog = () => {
    setIsDialogOpen(true);
  };

  const handleClosePrintDialog = () => {
    setIsDialogOpen(false);
  };

  const handleConvertToSale = () => {
    if (!quotationData) {
      showErrorToast({
        title: "Error",
        description: "No hay datos de cotización para convertir",
        duration: 2000,
      });
      return;
    }

    // - Cambiar modo a sale-strict
    // - Convertir items
    // - Guardar en sessionStorage
    // - Mostrar modal si hay cambios
    // - Navegar después de confirmar
    importQuotation(quotationData);
  };

  const handleOpenCartClearAlert = () => {
    setShowClearCartConfirm(true);
  };

  const handleCloseCartClearAlert = () => {
    setShowClearCartConfirm(false);
  };

  const handleConfirmCartClear = () => {
    handleConvertToSale();
    setShowClearCartConfirm(false);
  };

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
                    cotizaciones
                  </p>
                }
                buttonProps={{
                  variant: "default",
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
                    {quotationData?.cantidad_detalles ?? 0}{" "}
                    {(quotationData?.cantidad_detalles ?? 0) === 1
                      ? "producto"
                      : "productos"}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <ProtectedAction
                permission="cot-edit"
                roles={["Super Admin", "Administrador", "Vendedor"]}
                fallback={null}
              >
                <TooltipButton
                  onClick={handleUpdateQuotation}
                  tooltip="Editar cotizacion"
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
                permission="ven-create"
                roles={["Super Admin", "Administrador", "Vendedor"]}
                fallback={null}
              >
                <TooltipButton
                  onClick={
                    cartUtils.getCartCount() > 0
                      ? handleOpenCartClearAlert
                      : handleConvertToSale
                  }
                  tooltip={
                    quotationData?.convertida
                      ? "Esta cotización ya fue convertida a venta"
                      : "Crear una venta a partir de esta cotización"
                  }
                  buttonProps={{
                    variant: quotationData?.convertida ? "secondary" : "outline",
                    size: "sm",
                    className: "gap-2",
                    disabled: isImporting || quotationData?.convertida === true,
                  }}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      {quotationData?.convertida ? "Ya convertida" : "Convertir a Venta"}
                    </>
                  )}
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
                    variant: "default",
                    size: "sm",
                  }}
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </TooltipButton>
              </ProtectedAction>

              <ProtectedAction
                permission="cot-delete"
                roles={["Super Admin", "Administrador", "Vendedor"]}
                fallback={null}
              >
                <TooltipButton
                  onClick={() => handleOpenDeleteAlert(quotationData?.id)}
                  tooltip="Eliminar cotizacion"
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
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
              <FileText className="size-4 text-muted-foreground" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Fecha</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  {formatDate(quotationData?.fecha ?? "")}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Anticipo
                </Label>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(quotationData?.anticipo)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Tipo de cotizacion
                </Label>
                <br />
                <Badge
                  variant={getContextColor(
                    quotationData?.tipo_cotizacion ?? ""
                  )}
                  className="rounded w-max"
                >
                  {quotationData?.tipo_cotizacion}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Forma de cotizacion
                </Label>
                <br />
                <Badge variant="secondary" className="rounded w-max">
                  {quotationData?.forma_cotizacion}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <p className="text-sm font-medium">
                  {quotationData?.cliente?.cliente}
                </p>
              </div>
              {quotationData?.responsable_cotizacion && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Responsable
                  </Label>
                  <p className="text-sm font-medium">
                    {[
                      quotationData?.responsable_cotizacion?.nombre,
                      quotationData?.responsable_cotizacion?.apellido_paterno,
                      quotationData?.responsable_cotizacion?.apellido_materno,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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

      <ConfirmationModal
        isOpen={showClearCartConfirm}
        onClose={handleCloseCartClearAlert}
        onConfirm={handleConfirmCartClear}
        title="¿Convertir a venta?"
        message="El carrito actual tiene productos. Al continuar, se vaciará el carrito y se cargarán los productos de esta cotización."
        alertMessage="Esta acción vaciará el carrito actual."
        confirmText="Continuar"
        variant="warning"
      />

      {isDialogOpen && (
        <PDFViewer
          id={quotationId ?? 0}
          pdfBlob={pdfBlob}
          isLoading={isLoadingPdf}
          isError={isErrorPdf}
          onClose={handleClosePrintDialog}
          isOpen={isDialogOpen}
          pdfName="cotizacion"
          title={`Cotización Nro. ${quotationData?.id}`}
        />
      )}

      <CartModeConversionModal
        open={showConversionModal}
        onClose={cancelConversion}
        targetMode="sale-strict"
        shouldGoBackOnClose={false}
        onConfirm={confirmConversion}
        context="import"
        previewData={previewData}
        executeCloseOnConfirm={false}
      />
    </main>
  );
};

export default QuotationDetailScreen;
