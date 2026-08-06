import type { ProductGet } from "@/modules/products/types/ProductGet";

/**
 * Línea del carrito de pedido: snapshot del producto (no solo el id) +
 * cantidad acumulada + fecha de alta. Sin campos de precio/costo — esa
 * derivación es responsabilidad exclusiva de `useOrderDetails` al momento
 * del traspaso, no del carrito.
 */
export interface OrderCartItem {
  product: ProductGet;
  cantidad: number;
  /** ISO timestamp — habilita el aviso de antigüedad en el panel */
  addedAt: string;
}

export interface OrderCartState {
  items: OrderCartItem[];
  /**
   * `false` únicamente en `NULL_ORDER_CART` (scope sin resolver: sin
   * usuario o sin sucursal, incluida la ventana de hidratación async del
   * auth). Los stores reales creados por `createOrderCartStore` siempre
   * nacen con `isReady: true` — si el scope no está resuelto, no se crea
   * store real.
   */
  isReady: boolean;
}

export interface OrderCartActions {
  /** Si el producto ya está en el carrito, suma `cantidad` en vez de crear una segunda línea. */
  addItem: (product: ProductGet, cantidad?: number) => void;
  /** Igual que `addItem` pero para una tanda (alta masiva desde selección múltiple). */
  addMany: (products: ProductGet[], cantidad?: number) => void;
  /** Ignora valores `<= 0` o `NaN` — la línea queda con la cantidad anterior. */
  updateCantidad: (productId: number, cantidad: number) => void;
  removeItem: (productId: number) => void;
  /** Usado en el traspaso a pedido: limpia únicamente el subconjunto transferido. */
  removeMany: (productIds: number[]) => void;
  clear: () => void;
}

export type OrderCartStore = OrderCartState & OrderCartActions;
