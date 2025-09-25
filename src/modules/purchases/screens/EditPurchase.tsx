import { Button } from "@/components/atoms/button";
import { Kbd } from "@/components/atoms/kbd";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import TooltipButton from "@/components/common/TooltipButton";
import { CornerUpLeft, Loader2, Save } from "lucide-react";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams } from "react-router";
import FormCreatePurchase from "../components/FormCreatePurchase";
import PurchaseDetailSkeleton from "../components/purchaseDetail/PurchaseDetailSkeleton";
import PurchaseDetailsTable from "../components/PurchaseDetailsTable";
import { usePurchaseById } from "../hooks/usePurchaseById";
import { usePurchaseEdit } from "../hooks/usePurchaseEdit";

const EditPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { purchaseId } = useParams();

  if (!Number(purchaseId)) {
    return (
      <ErrorDataComponent
        errorMessage="ID de compra inválido."
        showButtonIcon={false}
        buttonText="Ir a lista de compras"
        onRetry={() => navigate("/dashboard/list-purchases")}
      />
    );
  }

  const {
    data: purchase,
    isLoading: isLoadingPurchase,
    isError: isErrorPurchase,
    refetch: refetchPurchase,
  } = usePurchaseById(Number(purchaseId));

  const {
    formData,
    errors,
    isLoading: isSaving,
    handleChange,
    handleBlur,
    handleSubmit,
  } = usePurchaseEdit(purchase);

  const handleGoBack = () => {
    navigate(`/dashboard/purchases/${purchaseId}`);
  };

  const handleSave = async () => {
    const success = await handleSubmit(Number(purchaseId));
    if (success) {
      // Redirigir de vuelta a la vista de detalle
      navigate(`/dashboard/purchases/${purchaseId}`);
    }
  };

  // Shortcuts
  useHotkeys('escape', handleGoBack, {
    scopes: ["esc-key"],
    enabled: true
  });

  if (isLoadingPurchase) {
    return <PurchaseDetailSkeleton />;
  }

  if (isErrorPurchase) {
    return (
      <ErrorDataComponent
        errorMessage="No se pudo cargar la compra."
        onRetry={refetchPurchase}
      />
    );
  }  
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TooltipButton
                tooltipContentProps={{
                  align: 'start'
                }}
                onClick={handleGoBack}
                tooltip={<p>Presiona <Kbd>esc</Kbd> para volver al detalle</p>}
                buttonProps={{
                  variant: 'default',
                }}
              >
                <CornerUpLeft />
              </TooltipButton>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                  Editar Compra #{purchase?.nro}
                </h1>
                {purchase && (
                  <p className="text-sm text-gray-600">
                    {purchase.proveedor.proveedor} - {purchase.cantidad_detalles} {purchase.cantidad_detalles === 1 ? 'producto' : 'productos'}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGoBack}
                variant="outline"
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 space-y-6">
            <FormCreatePurchase
              formData={formData}
              errors={errors}
              isLoading={isSaving}
              onChange={handleChange}
              onBlur={handleBlur}
              onSubmit={handleSave}
            />
            
            <PurchaseDetailsTable
              detalles={formData.detalles}
              setDetalles={(detalles) => handleChange("detalles", detalles)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPurchase;
