import { Button } from "@/components/atoms/button";
import { Kbd } from "@/components/atoms/kbd";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import TooltipButton from "@/components/common/TooltipButton";
import { useProductSelectorWindow } from "@/hooks/useSecondaryWindow";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useCommand } from "@/keybindings";
import { CornerUpLeft, Loader2, Save } from "lucide-react";
import {
  roundTo5Decimals,
  multiplyPrecise,
  addPrecise,
  dividePrecise,
} from "@/utils/decimalUtils";
import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import FormCreatePurchase from "../components/FormCreatePurchase";
import PurchaseDetailSkeleton from "../components/purchaseDetail/PurchaseDetailSkeleton";
import PurchaseDetailsTable from "../components/PurchaseDetailsTable";
import { usePurchaseById } from "../hooks/usePurchaseById";
import { usePurchaseEdit } from "../hooks/usePurchaseEdit";
import { Card, CardContent } from "@/components/atoms/card";

const EditPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { purchaseId } = useParams();
  const { closeCurrentTab } = useTabNavigation();

  // Estado para el tipo de cambio (tc_compra)
  const [exchangeRate, setExchangeRate] = useState(() => {
    const saved = localStorage.getItem("purchase_exchange_rate");
    return saved ? parseFloat(saved) : 6.96;
  });

  const {
    data: purchase,
    isLoading: isLoadingPurchase,
    isError: isErrorPurchase,
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
        return;
      }

      const costo = roundTo5Decimals(parseFloat(product.precio_venta) || 0);
      const inc_p_venta = 30;
      const inc_p_venta_alt = 15;

      // Calcular precios con precisión
      const multiplier = addPrecise(1, dividePrecise(inc_p_venta, 100));
      const precio_venta = multiplyPrecise(costo, multiplier);
      const multiplierAlt = addPrecise(1, dividePrecise(inc_p_venta_alt, 100));
      const precio_venta_alt = multiplyPrecise(precio_venta, multiplierAlt);
      const subtotal = multiplyPrecise(costo, 1);

      const newDetail = {
        id_producto: product.id.toString(),
        cantidad: 1,
        costo: costo,
        inc_p_venta: roundTo5Decimals(inc_p_venta),
        precio_venta: precio_venta,
        inc_p_venta_alt: roundTo5Decimals(inc_p_venta_alt),
        precio_venta_alt: precio_venta_alt,
        producto: product,
        subtotal: subtotal,
        tc_compra: roundTo5Decimals(exchangeRate),
      };

      handleChange("detalles", [...formData.detalles, newDetail]);
    },
    [formData.detalles, handleChange, exchangeRate]
  );

  // Hook para manejar la ventana secundaria de productos
  const productWindow = useProductSelectorWindow({
    context: "purchase",
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

  useCommand("actions.closeModal", handleGoBack);

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
    );
  }

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <header className="border-border flex-shrink-0 border bg-card rounded-lg p-2 sm:px-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <TooltipButton
              tooltipContentProps={{
                align: "start",
              }}
              onClick={handleGoBack}
              tooltip={
                <p>
                  Presiona <Kbd>esc</Kbd> para volver al detalle
                </p>
              }
              buttonProps={{
                variant: "default",
              }}
            >
              <CornerUpLeft />
            </TooltipButton>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Editar Compra #{purchase?.nro}
              </h1>
              {purchase && (
                <p className="text-sm text-gray-600">
                  {purchase.proveedor.proveedor} - {purchase.cantidad_detalles}{" "}
                  {purchase.cantidad_detalles === 1 ? "producto" : "productos"}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2"></div>
        </div>
      </header>

      <div className="gap-2 flex-1 min-h-screen md:min-h-0">
        <div className="h-full flex flex-col gap-2">
          {/* Formulario superior */}
          <div className="flex-shrink-0">
            <FormCreatePurchase
              formData={formData}
              errors={errors}
              isLoading={isSaving}
              onChange={handleChange}
              onBlur={handleBlur}
              onSubmit={handleSave}
            />
          </div>

          {/* Tabla de detalles */}
          <div className="flex-1 min-h-0">
            <div className="h-full min-h-screen md:min-h-auto flex flex-col gap-2">
              <div className="flex-1 min-h-0">
                <div className="h-full flex flex-col">
                  <PurchaseDetailsTable
                    detalles={formData.detalles}
                    setDetalles={(detalles) =>
                      handleChange("detalles", detalles)
                    }
                    toggleSelectorMode={toggleSelectorMode}
                    onExchangeRateChange={setExchangeRate}
                  />
                </div>
              </div>

              <Card className="border border-border shadow-none md:flex-shrink-0">
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-center justify-end gap-2">
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EditPurchase;
