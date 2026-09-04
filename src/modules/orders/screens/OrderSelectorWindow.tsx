import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { getWindowManager } from "@/platform";
import { useMemo } from "react";

import OrderSelector, {
  type OrderSelectorConfig,
} from "../components/orderSelector/OrderSelector";
import { DEFAULT_ORDER_STATUS } from "../constants/orderStatus";
import type { OrderGetAll } from "../types/orderGet.types";

/**
 * Contenedor VENTANA del selector de pedidos.
 *
 * Su única responsabilidad es el transporte: leer la configuración de la URL
 * con la que se abrió la ventana, y devolver la selección al padre por el
 * puerto de ventanas antes de cerrarse.
 *
 * Toda la lógica de selección vive en `OrderSelector`, que no sabe nada de
 * ventanas. Para montarlo en un diálogo se le pasan `config` y `onSelectOrder`
 * directamente — sin `windowId` ni eventos de por medio.
 */
const OrderSelectorWindow = () => {
  const windows = getWindowManager();

  const { windowId, config } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      windowId: params.get("windowId") || "order-selector-default",
      config: {
        estadoLetra: params.get("estado") || DEFAULT_ORDER_STATUS,
        context: params.get("context") || "purchase",
      } satisfies OrderSelectorConfig,
    };
  }, []);

  const handleSelectOrder = async (order: OrderGetAll) => {
    await windows.emitToWindow(windowId, "order-selected", { id: order.id });
    await windows.closeCurrentWindow();
  };

  return (
    <ErrorBoundary name="OrderSelectorWindow">
      <div className="h-screen">
        <OrderSelector config={config} onSelectOrder={handleSelectOrder} />
      </div>
    </ErrorBoundary>
  );
};

export default OrderSelectorWindow;
