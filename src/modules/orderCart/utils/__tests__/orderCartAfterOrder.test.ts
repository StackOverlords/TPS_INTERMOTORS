/**
 * Lista de compras al registrar un pedido: qué se descuenta o se quita, y
 * cómo se deshace. Antes solo se descontaba lo traído con "Traer del
 * carrito"; quien armaba el pedido buscando los productos a mano tenía que
 * vaciar la lista después.
 */

import { describe, expect, it } from 'vitest';
import type { OrderCartItem } from '../../types/orderCart.types';
import {
  orderedQuantitiesByProduct,
  planOrderCartRemovals,
  resolveOrderCartOnOrderRegistered,
  restoreOrderCartRemovals,
} from '../orderCartAfterOrder';

const item = (id: number, cantidad: number, addedAt: string): OrderCartItem => ({
  product: {
    id,
    descripcion: `Producto ${id}`,
    codigo_oem: `OEM-${id}`,
    marca: null,
    stock_actual: 0,
    pedido_transito: 0,
    pedido_almacen: 0,
  } as unknown as OrderCartItem['product'],
  cantidad,
  addedAt,
});

const LIST = [
  item(1, 10, '2026-10-01T10:00:00Z'),
  item(2, 3, '2026-10-01T11:00:00Z'),
  item(3, 5, '2026-10-01T12:00:00Z'),
];

const quantities = (items: OrderCartItem[]) =>
  items.map((i) => [i.product.id, i.cantidad] as const);

describe('orderedQuantitiesByProduct', () => {
  it('suma por producto e ignora cantidades inválidas', () => {
    const ordered = orderedQuantitiesByProduct([
      { id_producto: 1, cantidad: 4 },
      { id_producto: 1, cantidad: '2' },
      { id_producto: 2, cantidad: 0 },
      { id_producto: 3, cantidad: 'abc' },
    ]);
    expect([...ordered]).toEqual([[1, 6]]);
  });
});

describe('planOrderCartRemovals', () => {
  // Pedido armado a mano: 6 del 1 (había 10), 3 del 2 (había 3), 7 del 9 (no está en la lista).
  const ordered = new Map([
    [1, 6],
    [2, 3],
    [9, 7],
  ]);

  it('descontar: saca lo pedido; si se pidió menos, queda el resto', () => {
    const removals = planOrderCartRemovals(LIST, ordered, 'subtract');
    expect(removals.map((r) => [r.item.product.id, r.cantidad])).toEqual([
      [1, 6],
      [2, 3],
    ]);
  });

  it('quitar: saca de la lista todo producto que entró en el pedido', () => {
    const removals = planOrderCartRemovals(LIST, ordered, 'remove');
    expect(removals.map((r) => [r.item.product.id, r.cantidad])).toEqual([
      [1, 10],
      [2, 3],
    ]);
  });

  it('nunca saca más de lo que hay en la lista', () => {
    const removals = planOrderCartRemovals(LIST, new Map([[2, 50]]), 'subtract');
    expect(removals.map((r) => r.cantidad)).toEqual([3]);
  });

  it('un pedido sin productos de la lista no la toca', () => {
    expect(planOrderCartRemovals(LIST, new Map([[9, 1]]), 'remove')).toEqual([]);
  });
});

describe('restoreOrderCartRemovals (Deshacer)', () => {
  it('devuelve la lista a como estaba, con las líneas en su lugar', () => {
    const removals = planOrderCartRemovals(LIST, new Map([[1, 10], [2, 1]]), 'subtract');
    // Lo que deja el pedido: el 1 desaparece, el 2 queda con 2.
    const afterOrder = [item(2, 2, LIST[1].addedAt), LIST[2]];

    expect(quantities(restoreOrderCartRemovals(afterOrder, removals))).toEqual(
      quantities(LIST),
    );
  });

  it('suma sobre cambios hechos mientras tanto, no los pisa', () => {
    const removals = planOrderCartRemovals(LIST, new Map([[3, 5]]), 'remove');
    // Mientras tanto se volvió a agregar el 3 (2 unidades).
    const meanwhile = [LIST[0], LIST[1], item(3, 2, '2026-10-02T09:00:00Z')];

    expect(quantities(restoreOrderCartRemovals(meanwhile, removals))).toEqual([
      [1, 10],
      [2, 3],
      [3, 7],
    ]);
  });
});

describe('resolveOrderCartOnOrderRegistered', () => {
  it('acepta los dos modos y cae a "descontar" con cualquier otro valor', () => {
    expect(resolveOrderCartOnOrderRegistered('remove')).toBe('remove');
    expect(resolveOrderCartOnOrderRegistered('subtract')).toBe('subtract');
    expect(resolveOrderCartOnOrderRegistered(undefined)).toBe('subtract');
    expect(resolveOrderCartOnOrderRegistered('borrar')).toBe('subtract');
  });
});
