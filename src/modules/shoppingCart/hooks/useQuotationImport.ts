/**
 * Hook para importar cotizaciones a ventas
 */

import { useCallback, useState } from "react";
import { useCartWithUtils } from "@/modules/shoppingCart/hooks/useCartWithUtils";
import type { QuotationGetById } from "@/modules/quotations/types/quotationGet.types";
import type { Sale } from "@/modules/sales/types/sale";
import type { UseFormSetValue } from "react-hook-form";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import {
  extractFormDataFromQuotation,
  quotationItemToCartItem,
} from "../utils/cartImportHelpers";
import type { ConversionPreview, CartMode } from "../types/cart.types";

export interface UseQuotationImportOptions {
  setValue?: UseFormSetValue<Sale>;
  onImportComplete?: () => void;
}

export interface UseQuotationImportResult {
  isImporting: boolean;
  showConversionModal: boolean;
  previewData: ConversionPreview | null;
  importQuotation: (quotation: QuotationGetById) => void;
  confirmConversion: (selectedMode: CartMode) => void;
  cancelConversion: () => void;
}

/**
 * Hook para importar cotizaciones al flujo de crear venta
 */
export const useQuotationImport = (
  options: UseQuotationImportOptions,
): UseQuotationImportResult => {
  const { setValue, onImportComplete } = options;

  const user = authSDK.getCurrentUser();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const { setCartMode, previewQuotationImport, importFromQuotation } =
    useCartWithUtils(user?.name || "", selectedBranchId ?? "");

  const [isImporting, setIsImporting] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [previewData, setPreviewData] = useState<ConversionPreview | null>(
    null,
  );
  const [pendingQuotation, setPendingQuotation] =
    useState<QuotationGetById | null>(null);

  /**
   * Importa una cotización al carrito y formulario
   */
  const importQuotation = useCallback(
    (quotation: QuotationGetById) => {
      setIsImporting(true);
      setPendingQuotation(quotation);

      try {
        // Convertir items de cotización a CartItems
        const cartItems = quotation.detalles.map(quotationItemToCartItem);

        // PREVIEW ANTES DE IMPORTAR (para mostrar en modal)
        // Por defecto mostramos preview en sale-strict
        const preview = previewQuotationImport(cartItems, "sale-strict");
        setPreviewData(preview);

        // Extraer datos del formulario
        const formData = extractFormDataFromQuotation(quotation);

        // Guardar cotización completa y formData en sessionStorage
        sessionStorage.setItem(
          `quotation-import-pending-${user?.name}-${selectedBranchId}`,
          JSON.stringify({
            quotation,
            formData,
          }),
        );

        // Si hay cambios EN MODO STRICT, mostrar modal
        if (preview.willHaveChanges) {
          setShowConversionModal(true);
        } else {
          // No hay cambios, importar directamente en modo strict
          setCartMode("sale-strict");
          executeImport(quotation, formData, "sale-strict");
          setIsImporting(false);
          onImportComplete?.();
        }
      } catch (error) {
        console.error("Error al importar cotización:", error);
        setIsImporting(false);
        setPendingQuotation(null);
        setPreviewData(null);
      }
    },
    [
      previewQuotationImport,
      user?.name,
      selectedBranchId,
      onImportComplete,
      setCartMode,
    ],
  );

  /**
   * Ejecuta la importación real al carrito
   */
  const executeImport = useCallback(
    (
      quotation: QuotationGetById,
      formData: ReturnType<typeof extractFormDataFromQuotation>,
      importMode: CartMode,
    ) => {
      try {
        setCartMode(importMode);

        importFromQuotation(quotation);

        // Cargar cada campo al formulario
        if (setValue) {
          if (formData.id_cliente) setValue("id_cliente", formData.id_cliente);
          if (formData.cliente_nombre)
            setValue("cliente_nombre", formData.cliente_nombre);
          if (formData.cliente_nit)
            setValue("cliente_nit", formData.cliente_nit);
          if (formData.nro_comprobante)
            setValue("nro_comprobante", formData.nro_comprobante);
          if (formData.nro_comprobante2)
            setValue("nro_comprobante2", formData.nro_comprobante2);
          if (formData.tipo_venta) setValue("tipo_venta", formData.tipo_venta);
          if (formData.forma_venta)
            setValue("forma_venta", formData.forma_venta);
          if (formData.plazo_pago) setValue("plazo_pago", formData.plazo_pago);
          if (formData.vehiculo) setValue("vehiculo", formData.vehiculo);
          if (formData.nro_motor) setValue("nro_motor", formData.nro_motor);
          if (formData.comentario) setValue("comentario", formData.comentario);
        }
      } catch (error) {
        console.error("Error al ejecutar importación:", error);
      }
    },
    [importFromQuotation, setValue, setCartMode],
  );

  /**
   * Confirma la conversión después del modal
   */
  const confirmConversion = useCallback(
    (selectedMode: CartMode) => {
      if (!pendingQuotation) return;

      const storageKey = `quotation-import-pending-${user?.name}-${selectedBranchId}`;
      const savedData = sessionStorage.getItem(storageKey);

      if (savedData) {
        const { quotation, formData } = JSON.parse(savedData);
        executeImport(quotation, formData, selectedMode);
      }

      setShowConversionModal(false);
      setIsImporting(false);
      setPendingQuotation(null);
      setPreviewData(null);

      onImportComplete?.();
    },
    [
      pendingQuotation,
      executeImport,
      user?.name,
      selectedBranchId,
      onImportComplete,
    ],
  );

  /**
   * Cancela la conversión y limpia todo
   */
  const cancelConversion = useCallback(() => {
    setShowConversionModal(false);
    setIsImporting(false);
    setPendingQuotation(null);
    setPreviewData(null);

    sessionStorage.removeItem(
      `quotation-import-pending-${user?.name}-${selectedBranchId}`,
    );
  }, [user?.name, selectedBranchId]);

  return {
    isImporting,
    showConversionModal,
    previewData,
    importQuotation,
    confirmConversion,
    cancelConversion,
  };
};
