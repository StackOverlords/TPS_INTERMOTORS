import { create } from "zustand";
import {
  createOrderCartStore,
  type OrderCartStoreInstance,
} from "./orderCartStore";
import type { OrderCartStore } from "../types/orderCart.types";

/**
 * Registry módulo-nivel: una instancia de store por scope (usuario+sucursal).
 * Mirrors `CartManager` (`shoppingCart/services/cartManager.ts`), sin la
 * ceremonia de clase/singleton — un `Map` alcanza.
 */
const stores = new Map<string, OrderCartStoreInstance>();

export const getOrCreateOrderCartStore = (
  scopeKey: string,
): OrderCartStoreInstance => {
  const existing = stores.get(scopeKey);
  if (existing) return existing;

  const created = createOrderCartStore(scopeKey);
  stores.set(scopeKey, created);
  return created;
};

/**
 * Store "nulo" para cuando el scope no está resuelto (sin usuario o sin
 * sucursal — incluye la ventana de hidratación async del auth SDK).
 * `isReady: false`, vacío, no persistido (sin middleware `persist`), y con
 * acciones no-op: escribir acá no debe crear la falsa sensación de que el
 * item quedó guardado en algún lado.
 */
export const NULL_ORDER_CART: OrderCartStoreInstance = create<OrderCartStore>()(
  () => ({
    items: [],
    isReady: false,
    addItem: () => {},
    addMany: () => {},
    updateCantidad: () => {},
    removeItem: () => {},
    removeMany: () => {},
    removeQuantities: () => {},
    clear: () => {},
  }),
);
