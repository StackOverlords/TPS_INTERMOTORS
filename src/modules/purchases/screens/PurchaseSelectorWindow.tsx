import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { getWindowManager } from "@/platform";
import type { PurchaseGet } from "@/modules/purchases/types/PurchaseGet";
import { useMemo } from "react";

import PurchaseSelector, {
  type PurchaseSelectorConfig,
} from "../components/purchaseSelector/PurchaseSelector";

/**
 * Contenedor VENTANA del selector de compras.
 *
 * Solo transporte: lee la configuración de la URL con la que se abrió la
 * ventana y devuelve la selección al padre por el puerto antes de cerrarse.
 * La lógica vive en `PurchaseSelector`, que no sabe nada de ventanas.
 */
const PurchaseSelectorWindow: React.FC = () => {
  const windows = getWindowManager();

  const { windowId, config } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      windowId: params.get("windowId") || "purchase-selector-default",
      config: {
        context: params.get("context") || "transfer",
      } satisfies PurchaseSelectorConfig,
    };
  }, []);

  const handleSelectPurchase = async (purchase: PurchaseGet) => {
    await windows.emitToWindow(windowId, "purchase-selected", purchase);
    await windows.closeCurrentWindow();
  };

  const handleClose = async () => {
    await windows.emitToWindow(windowId, "window-closed", { canceled: true });
    await windows.closeCurrentWindow();
  };

  return (
    <ErrorBoundary name="PurchaseSelectorWindow">
      <div className="h-screen">
        <PurchaseSelector
          config={config}
          onSelectPurchase={handleSelectPurchase}
          onClose={handleClose}
        />
      </div>
    </ErrorBoundary>
  );
};

export default PurchaseSelectorWindow;
