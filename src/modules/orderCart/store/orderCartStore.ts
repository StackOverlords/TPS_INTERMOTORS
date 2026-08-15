import { create } from "zustand";
import type { StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { ORDER_CART_STORAGE_PREFIX } from "../constants/orderCart.constants";
import type {
  OrderCartItem,
  OrderCartProduct,
  OrderCartStore,
} from "../types/orderCart.types";

type PersistedOrderCart = Pick<OrderCartStore, "items">;

const toOrderCartProduct = (product: OrderCartProduct): OrderCartProduct => ({
  id: product.id,
  descripcion: product.descripcion,
  codigo_oem: product.codigo_oem,
  marca: product.marca,
  stock_actual: product.stock_actual,
  pedido_transito: product.pedido_transito,
  pedido_almacen: product.pedido_almacen,
});

/**
 * Store por scope (usuario+sucursal). Factory, no singleton — cada
 * `scopeKey` obtiene su propia instancia y su propia key de localStorage,
 * a cargo del registry (`orderCartRegistry.ts`).
 */
export const createOrderCartStore = (scopeKey: string) =>
  create<OrderCartStore>()(
    devtools(
      persist(
        (set, get) => ({
          items: [],
          isReady: true,

          addItem: (product, cantidad = 1) => {
            get().addMany([product], cantidad);
          },

          addMany: (products, cantidad = 1) => {
            let items = get().items;

            products.forEach((product) => {
              const existing = items.find((i) => i.product.id === product.id);

              items = existing
                ? items.map((i) =>
                    i.product.id === product.id
                      ? {
                          ...i,
                          product: toOrderCartProduct(product),
                          cantidad: i.cantidad + cantidad,
                        }
                      : i,
                  )
                : [
                    ...items,
                    {
                      product: toOrderCartProduct(product),
                      cantidad,
                      addedAt: new Date().toISOString(),
                    } satisfies OrderCartItem,
                  ];
            });

            set({ items });
          },

          updateCantidad: (productId, cantidad) => {
            if (!Number.isFinite(cantidad) || cantidad <= 0) return;

            set({
              items: get().items.map((i) =>
                i.product.id === productId ? { ...i, cantidad } : i,
              ),
            });
          },

          removeItem: (productId) => {
            set({
              items: get().items.filter((i) => i.product.id !== productId),
            });
          },

          removeMany: (productIds) => {
            const idsToRemove = new Set(productIds);
            set({
              items: get().items.filter((i) => !idsToRemove.has(i.product.id)),
            });
          },

          removeQuantities: (quantities) => {
            const quantitiesByProduct = new Map(
              quantities.map(({ productId, cantidad }) => [productId, cantidad]),
            );

            set({
              items: get().items.flatMap((item) => {
                const quantityToRemove = quantitiesByProduct.get(item.product.id);
                if (!quantityToRemove) return [item];

                const remainingQuantity = item.cantidad - quantityToRemove;
                return remainingQuantity > 0
                  ? [{ ...item, cantidad: remainingQuantity }]
                  : [];
              }),
            });
          },

          clear: () => set({ items: [] }),
        }),
        {
          name: `${ORDER_CART_STORAGE_PREFIX}${scopeKey}`,
          storage: createJSONStorage(() => localStorage),
          partialize: (state): PersistedOrderCart => ({ items: state.items }),
          version: 1,
          merge: (persistedState, currentState) => {
            const persisted = persistedState as Partial<PersistedOrderCart> | undefined;
            const items = (persisted?.items ?? [])
              .filter(
                (item): item is OrderCartItem => Boolean(item?.product?.id),
              )
              .map((item) => ({
                ...item,
                product: toOrderCartProduct(item.product),
              }));

            return { ...currentState, items };
          },
        },
      ),
      { name: `order-cart-${scopeKey}` },
    ),
  );

/**
 * Tipo de instancia de store, deliberadamente el bound-store SIN los
 * extras de middleware (`.persist`, devtools). `NULL_ORDER_CART`
 * (`orderCartRegistry.ts`) es un store plano sin middleware — tipar acá
 * con `ReturnType<typeof createOrderCartStore>` (que sí incluye esos
 * extras) rompería esa asignación. Todo consumidor solo necesita
 * `getState`/`setState`/`subscribe` + el call-signature de hook, que es
 * exactamente lo que expone este tipo.
 */
export type OrderCartStoreInstance = UseBoundStore<StoreApi<OrderCartStore>>;
