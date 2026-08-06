import { create } from "zustand";
import type { StoreApi, UseBoundStore } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { ORDER_CART_STORAGE_PREFIX } from "../constants/orderCart.constants";
import type { OrderCartItem, OrderCartStore } from "../types/orderCart.types";

type PersistedOrderCart = Pick<OrderCartStore, "items">;

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
                      ? { ...i, cantidad: i.cantidad + cantidad }
                      : i,
                  )
                : [
                    ...items,
                    {
                      product,
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

          clear: () => set({ items: [] }),
        }),
        {
          name: `${ORDER_CART_STORAGE_PREFIX}${scopeKey}`,
          storage: createJSONStorage(() => localStorage),
          partialize: (state): PersistedOrderCart => ({ items: state.items }),
          version: 1,
          merge: (persistedState, currentState) => {
            const persisted = persistedState as Partial<PersistedOrderCart> | undefined;
            const items = (persisted?.items ?? []).filter(
              (item): item is OrderCartItem => Boolean(item?.product?.id),
            );

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
