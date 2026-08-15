import type { ProductGet } from "@/modules/products/types/ProductGet";

export type OrderCartProduct = Pick<
  ProductGet,
  | "id"
  | "descripcion"
  | "codigo_oem"
  | "marca"
  | "stock_actual"
  | "pedido_transito"
  | "pedido_almacen"
>;

/**
 * Línea del carrito de pedido: snapshot mínimo para mostrar el producto +
 * cantidad acumulada + fecha de alta. Precio/costo se consulta nuevamente
 * al transferir para no crear pedidos con datos financieros persistidos.
 */
export interface OrderCartItem {
  product: OrderCartProduct;
  cantidad: number;
  /** ISO timestamp — habilita el aviso de antigüedad en el panel */
  addedAt: string;
}

export interface OrderCartQuantity {
  productId: number;
  cantidad: number;
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
  /** Elimina completamente las líneas indicadas. */
  removeMany: (productIds: number[]) => void;
  /** Descuenta solo la cantidad que quedó registrada en el pedido. */
  removeQuantities: (quantities: OrderCartQuantity[]) => void;
  clear: () => void;
}

export type OrderCartStore = OrderCartState & OrderCartActions;
