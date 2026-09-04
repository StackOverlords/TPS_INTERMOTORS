import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import type { QuotationGetById } from "@/modules/quotations/types/quotationGet.types";
import { getWindowManager } from "@/platform";
import { useMemo } from "react";

import QuotationSelector, {
  type QuotationSelectorConfig,
} from "../components/quotationSelector/QuotationSelector";

/**
 * Contenedor VENTANA del selector de cotizaciones.
 *
 * Solo transporte: traduce la URL a `config` y los callbacks a eventos del
 * puerto. La lógica vive en `QuotationSelector`, que no sabe de ventanas.
 */
const QuotationSelectorWindow: React.FC = () => {
  const windows = getWindowManager();

  const { windowId, config } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      windowId: params.get("windowId") || "quotation-selector-default",
      config: {
        context: params.get("context") || "default",
      } satisfies QuotationSelectorConfig,
    };
  }, []);

  const handleSelectQuotation = async (quotation: QuotationGetById) => {
    await windows.emitToWindow(windowId, "quotation-selected", quotation);
    await windows.closeCurrentWindow();
  };

  const handleClose = async () => {
    await windows.emitToWindow(windowId, "window-closed", { canceled: true });
    await windows.closeCurrentWindow();
  };

  return (
    <ErrorBoundary name="QuotationSelectorWindow">
      <div className="h-screen">
        <QuotationSelector
          config={config}
          onSelectQuotation={handleSelectQuotation}
          onClose={handleClose}
        />
      </div>
    </ErrorBoundary>
  );
};

export default QuotationSelectorWindow;
