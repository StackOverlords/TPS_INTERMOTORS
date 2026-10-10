import type {
  OrderCartItem,
  OrderCartOnOrderRegistered,
  OrderCartRemoval,
} from "../types/orderCart.types";

export const DEFAULT_ORDER_CART_ON_ORDER_REGISTERED: OrderCartOnOrderRegistered =
  "subtract";

/** Valor del comportamiento de la vista; cualquier otra cosa cae al valor por defecto. */
export function resolveOrderCartOnOrderRegistered(
  value: unknown,
): OrderCartOnOrderRegistered {
  return value === "subtract" || value === "remove"
    ? value
    : DEFAULT_ORDER_CART_ON_ORDER_REGISTERED;
}

/** Cantidad pedida por producto (suma si un producto aparece en más de una línea). */
export function orderedQuantitiesByProduct(
  details: ReadonlyArray<{ id_producto: number; cantidad: number | string }>,
): Map<number, number> {
  const quantities = new Map<number, number>();
  for (const detail of details) {
    const cantidad = Number(detail.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;
    quantities.set(detail.id_producto, (quantities.get(detail.id_producto) ?? 0) + cantidad);
  }
  return quantities;
}

/**
 * Qué saca de la lista de compras un pedido recién registrado.
 *
 * Cuenta todo producto del pedido que esté en la lista, haya entrado con
 * "Traer del carrito" o agregado a mano: antes solo se descontaba lo traído
 * del carrito, y quien armaba el pedido buscando los productos tenía que
 * vaciar la lista a mano después.
 */
export function planOrderCartRemovals(
  items: ReadonlyArray<OrderCartItem>,
  orderedQuantities: ReadonlyMap<number, number>,
  mode: OrderCartOnOrderRegistered,
): OrderCartRemoval[] {
  return items.flatMap((item) => {
    const ordered = orderedQuantities.get(item.product.id) ?? 0;
    if (ordered <= 0) return [];
    const cantidad = mode === "remove" ? item.cantidad : Math.min(item.cantidad, ordered);
    return cantidad > 0 ? [{ item, cantidad }] : [];
  });
}

/** Lista con lo sacado devuelto: suma a la línea si sigue, o la repone en su lugar. */
export function restoreOrderCartRemovals(
  items: ReadonlyArray<OrderCartItem>,
  removals: ReadonlyArray<OrderCartRemoval>,
): OrderCartItem[] {
  let next = [...items];
  for (const { item, cantidad } of removals) {
    if (cantidad <= 0) continue;
    const index = next.findIndex((i) => i.product.id === item.product.id);
    if (index >= 0) {
      next[index] = { ...next[index], cantidad: next[index].cantidad + cantidad };
      continue;
    }
    // Volver a su lugar: la lista está en orden de alta.
    const position = next.findIndex((i) => i.addedAt > item.addedAt);
    const restored = { ...item, cantidad };
    next =
      position === -1
        ? [...next, restored]
        : [...next.slice(0, position), restored, ...next.slice(position)];
  }
  return next;
}
