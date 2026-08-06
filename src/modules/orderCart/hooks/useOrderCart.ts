import { useMemo } from "react";
import { useStore } from "zustand";
import { useOrderCartScope } from "./useOrderCartScope";
import {
  getOrCreateOrderCartStore,
  NULL_ORDER_CART,
} from "../store/orderCartRegistry";
import type { OrderCartItem } from "../types/orderCart.types";

export interface UseOrderCartResult {
  items: OrderCartItem[];
  /** Cantidad de líneas distintas en el carrito (no la suma de cantidades). */
  count: number;
  isReady: boolean;
  addItem: (product: OrderCartItem["product"], cantidad?: number) => void;
  addMany: (products: OrderCartItem["product"][], cantidad?: number) => void;
  updateCantidad: (productId: number, cantidad: number) => void;
  removeItem: (productId: number) => void;
  removeMany: (productIds: number[]) => void;
  clear: () => void;
}

/**
 * Facade del carrito de pedido. Sin argumentos: resuelve el scope
 * (usuario+sucursal) internamente vía `useOrderCartScope` — así ningún
 * call site puede llavear mal el carrito (el defecto de `useCartWithUtils`
 * con `user.name`, ver design D2).
 *
 * `useMemo` acá guarda la IDENTIDAD del store (no el costo de crearlo) —
 * sin él, cada render pediría una instancia "nueva" al registry y
 * `useStore` perdería la suscripción entre renders.
 *
 * Scope `null` (sin usuario o sin sucursal, incluida la ventana de
 * hidratación async del auth) → `NULL_ORDER_CART`: vacío, no persistido,
 * `isReady: false`, acciones no-op.
 */
export function useOrderCart(): UseOrderCartResult {
  const scopeKey = useOrderCartScope();

  const store = useMemo(
    () => (scopeKey ? getOrCreateOrderCartStore(scopeKey) : NULL_ORDER_CART),
    [scopeKey],
  );

  const items = useStore(store, (s) => s.items);
  const isReady = useStore(store, (s) => s.isReady);
  const addItem = useStore(store, (s) => s.addItem);
  const addMany = useStore(store, (s) => s.addMany);
  const updateCantidad = useStore(store, (s) => s.updateCantidad);
  const removeItem = useStore(store, (s) => s.removeItem);
  const removeMany = useStore(store, (s) => s.removeMany);
  const clear = useStore(store, (s) => s.clear);

  return {
    items,
    count: items.length,
    isReady,
    addItem,
    addMany,
    updateCantidad,
    removeItem,
    removeMany,
    clear,
  };
}
