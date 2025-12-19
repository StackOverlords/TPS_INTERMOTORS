import { Button } from "@/components/atoms/button";
import { Kbd } from "@/components/atoms/kbd";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import TooltipButton from "@/components/common/TooltipButton";
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useCommand } from "@/keybindings";
import { CornerUpLeft, Loader2, Save } from "lucide-react";
import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import FormCreatePurchase from "../components/FormCreatePurchase";
import PurchaseDetailSkeleton from "../components/purchaseDetail/PurchaseDetailSkeleton";
import PurchaseDetailsTable from "../components/PurchaseDetailsTable";
import { usePurchaseById } from "../hooks/usePurchaseById";
import { usePurchaseEdit } from "../hooks/usePurchaseEdit";

const EditPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { purchaseId } = useParams();
  const { closeCurrentTab } = useTabNavigation();

  const {
    data: purchase,
    isLoading: isLoadingPurchase,
    isError: isErrorPurchase,
    // refetch: refetchPurchase,
  } = usePurchaseById(Number(purchaseId) || 0);

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
      // Cerrar la tab actual después de guardar exitosamente
      closeCurrentTab();
    }
  };

  // Función para agregar producto desde el panel de búsqueda
  const handleProductSelect = useCallback(
    (product: any) => {
      const existingDetail = formData.detalles.find(
        (d: any) => d.id_producto === product.id.toString()
      );

      if (existingDetail) {
        return; // Ya existe, no hacer nada
      }

      const costo = parseFloat(product.precio_venta) || 0;
      const inc_p_venta = 30; // 30% por defecto
      const inc_p_venta_alt = 15; // 15% por defecto

      const precio_venta = costo * (1 + inc_p_venta / 100);
      // precio_venta_alt se calcula en cadena sobre precio_venta, no sobre costo
      const precio_venta_alt = precio_venta * (1 + inc_p_venta_alt / 100);

      const newDetail = {
        id_producto: product.id.toString(),
        cantidad: 1,
        costo,
        inc_p_venta,
        precio_venta,
        inc_p_venta_alt,
        precio_venta_alt,
        producto: product,
        subtotal: costo * 1,
      };

      handleChange('detalles', [...formData.detalles, newDetail]);
    },
    [formData.detalles, handleChange]
  );

  // Hook para manejar la ventana secundaria de productos
  const productWindow = useProductSelectorWindow({
    context: 'purchase',
    instanceId: `edit-${purchaseId}`,
    onProductSelect: handleProductSelect,
    onlyWithStock: false,
  });

  // Toggle para abrir ventana secundaria
  const toggleSelectorMode = () => {
    if (productWindow.isOpen) {
      productWindow.close();
    }
    productWindow.open();
  };

  // // Shortcuts
  // useHotkeys('escape', handleGoBack, {
  //   scopes: ["esc-key"],
  //   enabled: true
  // });
  useCommand('actions.closeModal', handleGoBack)

  if (isLoadingPurchase) {
    return <PurchaseDetailSkeleton />;
  }

  if (isErrorPurchase || !purchase) {
    return (
      <div className="h-full flex items-center justify-center p-2 lg:p-8">
        <ErrorDataComponent
          errorMessage="No se pudo cargar la compra."
          showButtonIcon={false}
          buttonText="Ir a lista de compras"
          onRetry={() => navigate("/dashboard/list-purchases")}
        />
      </div>
    )
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
              toggleSelectorMode={toggleSelectorMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPurchase;
