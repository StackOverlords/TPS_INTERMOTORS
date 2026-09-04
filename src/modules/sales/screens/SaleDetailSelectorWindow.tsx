import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import type { ProductChange } from "@/modules/returns/hooks/useReturnDetails";
import type { UIReturnDetailCreate } from "@/modules/returns/types/returnCreate.types";
import type { UIReturnDetailUpdate } from "@/modules/returns/types/returnUpdate.types";
import { getWindowManager } from "@/platform";
import { useMemo } from "react";

import SaleDetailSelector, {
  type SaleDetailSelectorConfig,
} from "../components/saleDetailSelector/SaleDetailSelector";

/**
 * Contenedor VENTANA del selector de detalles de venta.
 *
 * Solo transporte: traduce la URL a `config` y los callbacks a eventos del
 * puerto. La lógica vive en `SaleDetailSelector`, que no sabe de ventanas.
 */
const SaleDetailSelectorWindow = () => {
  const windows = getWindowManager();

  const { windowId, config } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    let selectedItems: (UIReturnDetailCreate | UIReturnDetailUpdate)[] = [];
    const selectedItemsParam = params.get("selectedItems");
    if (selectedItemsParam) {
      try {
        selectedItems = JSON.parse(selectedItemsParam);
      } catch (e) {
        console.error("Error parsing selectedItems:", e);
      }
    }

    const id = params.get("windowId") || "sale-detail-selector-default";

    return {
      windowId: id,
      config: {
        // El windowId sirve de instanceId: es único por ventana abierta y
        // mantiene los filtros persistidos aislados, igual que antes.
        instanceId: id,
        context: params.get("context") || "default",
        mode: (params.get("mode") as "create" | "edit") || "create",
        selectedItems,
      } satisfies SaleDetailSelectorConfig,
    };
  }, []);

  const handleChangesApplied = async (changes: ProductChange[]) => {
    await windows.emitToWindow(
      windowId,
      "sale-details-changes-applied",
      changes,
    );
    await windows.closeCurrentWindow();
  };

  const handleClose = async () => {
    await windows.emitToWindow(windowId, "window-closed", { canceled: true });
    await windows.closeCurrentWindow();
  };

  return (
    <ErrorBoundary name="SaleDetailSelectorWindow">
      <div className="h-screen">
        <SaleDetailSelector
          config={config}
          onChangesApplied={handleChangesApplied}
          onClose={handleClose}
        />
      </div>
    </ErrorBoundary>
  );
};

export default SaleDetailSelectorWindow;
