/**
 * Store de la lista de compras: lo que saca un pedido y su "Deshacer",
 * pasando por las acciones reales (las que usa la pantalla de pedido).
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { OrderCartItem } from '../../types/orderCart.types';
import { planOrderCartRemovals } from '../../utils/orderCartAfterOrder';
import { createOrderCartStore } from '../orderCartStore';

const item = (id: number, cantidad: number, addedAt: string): OrderCartItem => ({
  product: { id, descripcion: `Producto ${id}` } as OrderCartItem['product'],
  cantidad,
  addedAt,
});

const LIST = [
  item(1, 10, '2026-10-01T10:00:00Z'),
  item(2, 3, '2026-10-01T11:00:00Z'),
  item(3, 5, '2026-10-01T12:00:00Z'),
];

const snapshot = (items: OrderCartItem[]) => items.map((i) => [i.product.id, i.cantidad]);

beforeEach(() => localStorage.clear());

describe.each(['subtract', 'remove'] as const)('al registrar un pedido (%s)', (mode) => {
  it('actualiza la lista y "Deshacer" la deja como estaba', () => {
    const store = createOrderCartStore(`test-${mode}`);
    store.setState({ items: LIST });

    const removals = planOrderCartRemovals(store.getState().items, new Map([[1, 4], [2, 3]]), mode);
    store.getState().removeQuantities(
      removals.map(({ item: line, cantidad }) => ({ productId: line.product.id, cantidad })),
    );

    expect(snapshot(store.getState().items)).toEqual(
      mode === 'subtract'
        ? [[1, 6], [3, 5]] // del 1 quedan 6; el 2 se pidió completo
        : [[3, 5]], // el 1 y el 2 salen de la lista
    );

    store.getState().restoreRemovals(removals);
    expect(snapshot(store.getState().items)).toEqual(snapshot(LIST));
  });
});
