import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { getWindowManager } from "@/platform";
import type { SelectedItem } from "@/types/windowSelectedItems";
import { useMemo } from "react";

import ProductSelector, {
  type ProductSelectorConfig,
  type ProductSelectorContext,
  type ProductWithQuantity,
} from "../components/productSelector/ProductSelector";
import type { ProductGet } from "../types/ProductGet";

/**
 * Contenedor VENTANA del selector de productos.
 *
 * Solo transporte: traduce la URL a `config` y los callbacks a eventos del
 * puerto. La lógica —1300 líneas— vive en `ProductSelector`, que no sabe de
 * ventanas y puede montarse igual dentro de un diálogo.
 */
const ProductSelectorWindow: React.FC = () => {
  const windows = getWindowManager();

  const { windowId, config } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    let selectedItems: SelectedItem[] = [];
    const selectedItemsParam = params.get("selectedItems");
    if (selectedItemsParam) {
      try {
        selectedItems = JSON.parse(selectedItemsParam);
      } catch (e) {
        console.error("Error parsing selectedItems:", e);
      }
    }

    const id = params.get("windowId") || "product-selector-default";

    return {
      windowId: id,
      config: {
        // El windowId hace de instanceId: es único por ventana abierta y
        // mantiene los filtros persistidos aislados, igual que antes.
        instanceId: id,
        context: (params.get("context") || "default") as ProductSelectorContext,
        multiSelect: params.get("multiSelect") === "true",
        mode: (params.get("mode") as "create" | "edit") || "create",
        validateStock: params.get("validateStock") !== "false",
        simpleMode: params.get("simpleMode") === "true",
        selectedItems,
      } satisfies ProductSelectorConfig,
    };
  }, []);

  const handleSelectProduct = async (product: ProductGet) => {
    await windows
      .emitToWindow(windowId, "product-selected", product)
      .catch(() => {});
    await windows.closeCurrentWindow();
  };

  const handleSelectProducts = async (products: ProductWithQuantity[]) => {
    await windows
      .emitToWindow(windowId, "product-multi-selected", products)
      .catch(() => {});
    await windows.closeCurrentWindow();
  };

  const handleClose = async () => {
    await windows
      .emitToWindow(windowId, "window-closed", { canceled: true })
      .catch(() => {});
    await windows.closeCurrentWindow();
  };

  return (
    <ErrorBoundary name="ProductSelectorWindow">
      <div className="h-screen">
        <ProductSelector
          config={config}
          onSelectProduct={handleSelectProduct}
          onSelectProducts={handleSelectProducts}
          onClose={handleClose}
        />
      </div>
    </ErrorBoundary>
  );
};

export default ProductSelectorWindow;
