import { beforeEach, describe, expect, it } from 'vitest';

import { createCartStore, type CartStore } from '../cartStore';
import { makeProduct } from './cartProduct.fixture';

/**
 * Tests de CARACTERIZACIÓN — validación de stock según el modo del carrito.
 *
 * El carrito tiene tres modos y cada uno trata el stock distinto:
 *
 *   sale-strict      No deja agregar ni superar el stock. Es el modo de venta.
 *   sale-permissive  Deja pasar, pero avisa con un warning.
 *   quote            Igual que permissive: una cotización puede pedir lo que
 *                    todavía no llegó.
 *
 * Confundir estos modos significa vender lo que no hay, así que conviene tener
 * el comportamiento congelado antes de tocar las pantallas que los usan.
 */

let store: CartStore;
const state = () => store.getState();

beforeEach(() => {
  sessionStorage.clear();
  store = createCartStore(`test-${Math.random()}`);
});

describe('modo sale-strict: bloquea', () => {
  beforeEach(() => state().setMode('sale-strict'));

  it('rechaza un producto sin stock', () => {
    const result = state().addItem(makeProduct({ stock_actual: 0 }));

    expect(result.success).toBe(false);
    expect(result.error).toBe('NO_STOCK');
    expect(state().items).toHaveLength(0);
  });

  it('rechaza superar el stock al volver a agregar', () => {
    const product = makeProduct({ stock_actual: 2 });
    state().addItem(product);
    state().addItem(product); // 2 de 2, todavía válido

    const result = state().addItem(product); // pediría 3

    expect(result.success).toBe(false);
    expect(result.error).toBe('INSUFFICIENT_STOCK');
    expect(state().getItemQuantity(1)).toBe(2);
  });

  it('rechaza una cantidad mayor al stock', () => {
    state().addItem(makeProduct({ stock_actual: 5 }));

    const result = state().updateQuantity(1, 6);

    expect(result.success).toBe(false);
    expect(result.error).toBe('INSUFFICIENT_STOCK');
    expect(state().getItemQuantity(1)).toBe(1);
  });

  it('acepta exactamente el stock disponible', () => {
    state().addItem(makeProduct({ stock_actual: 5 }));

    const result = state().updateQuantity(1, 5);

    expect(result.success).toBe(true);
    expect(state().getItemQuantity(1)).toBe(5);
  });
});

describe('modos permisivos: dejan pasar pero avisan', () => {
  it.each(['sale-permissive', 'quote'] as const)(
    'en modo %s agrega sin stock con warning',
    (mode) => {
      state().setMode(mode);

      const result = state().addItem(makeProduct({ stock_actual: 0 }));

      expect(result.success).toBe(true);
      expect(result.warning).toBe('NO_STOCK');
      expect(state().items).toHaveLength(1);
    },
  );

  it.each(['sale-permissive', 'quote'] as const)(
    'en modo %s permite superar el stock con warning',
    (mode) => {
      state().setMode(mode);
      const product = makeProduct({ stock_actual: 1 });
      state().addItem(product);

      const result = state().addItem(product); // 2 de 1

      expect(result.success).toBe(true);
      expect(result.warning).toBe('EXCEEDS_STOCK');
      expect(state().getItemQuantity(1)).toBe(2);
    },
  );

  it('permite una cantidad mayor al stock sin error', () => {
    state().setMode('sale-permissive');
    state().addItem(makeProduct({ stock_actual: 2 }));

    const result = state().updateQuantity(1, 50);

    expect(result.success).toBe(true);
    expect(state().getItemQuantity(1)).toBe(50);
  });
});

describe('cantidades inválidas', () => {
  beforeEach(() => {
    state().setMode('sale-permissive');
    state().addItem(makeProduct());
  });

  it.each([0, -1])('rechaza la cantidad %i en cualquier modo', (quantity) => {
    const result = state().updateQuantity(1, quantity);

    expect(result.success).toBe(false);
    expect(state().getItemQuantity(1)).toBe(1);
  });

  it('rechaza actualizar un producto que no está en el carrito', () => {
    const result = state().updateQuantity(999, 3);

    expect(result.success).toBe(false);
    expect(result.error).toBe('ITEM_NOT_FOUND');
  });
});

describe('canAddProduct', () => {
  beforeEach(() => state().setMode('sale-strict'));

  it('deja agregar mientras quede stock', () => {
    state().addItem(makeProduct({ stock_actual: 5 }));
    state().updateQuantity(1, 3);

    // Cuando SÍ se puede, solo devuelve `canAdd`. El cuánto queda no se
    // informa en el caso feliz.
    expect(state().canAddProduct(1, 1)).toEqual({ canAdd: true });
  });

  it('al negar, informa cuántas unidades quedaban disponibles', () => {
    state().addItem(makeProduct({ stock_actual: 5 }));
    state().updateQuantity(1, 4);

    // `available` (no `availableToAdd`) y solo aparece en el rechazo.
    expect(state().canAddProduct(1, 3)).toEqual({
      canAdd: false,
      reason: 'INSUFFICIENT_STOCK',
      available: 1,
    });
  });

  it('niega un producto sin stock', () => {
    state().setMode('sale-permissive'); // para poder meterlo sin stock
    state().addItem(makeProduct({ stock_actual: 0 }));
    state().setMode('sale-strict');

    expect(state().canAddProduct(1, 1)).toEqual({
      canAdd: false,
      reason: 'NO_STOCK',
    });
  });

  it('niega un producto que no está en el carrito', () => {
    expect(state().canAddProduct(999, 1)).toEqual({
      canAdd: false,
      reason: 'PRODUCT_NOT_FOUND',
    });
  });

  it.each(['sale-permissive', 'quote'] as const)(
    'en modo %s siempre deja agregar, sin mirar stock',
    (mode) => {
      state().setMode(mode);
      state().addItem(makeProduct({ stock_actual: 1 }));
      state().updateQuantity(1, 99);

      expect(state().canAddProduct(1, 50)).toEqual({ canAdd: true });
    },
  );
});

describe('validateCart', () => {
  /**
   * OJO con esto: `validateCart` NO valida en modos permisivos — devuelve
   * siempre `isValid: true`. La validación real ocurre al pasar a sale-strict,
   * que es el momento de facturar.
   *
   * Quien llame a validateCart desde una pantalla en modo quote y confíe en el
   * resultado, va a creer que el carrito está bien cuando nadie lo miró.
   */

  it.each(['sale-permissive', 'quote'] as const)(
    'en modo %s NO valida: siempre responde válido',
    (mode) => {
      state().setMode(mode);
      state().addItem(makeProduct({ id: 1, stock_actual: 0 }));

      expect(state().validateCart()).toEqual({ isValid: true, issues: [] });
    },
  );

  it('un carrito dentro del stock es válido', () => {
    state().setMode('sale-strict');
    state().addItem(makeProduct({ stock_actual: 10 }));

    expect(state().validateCart().isValid).toBe(true);
  });

  it('detecta las líneas que superan el stock', () => {
    // Se arma en permissive —donde el store deja pasar— y se valida en strict:
    // es exactamente lo que pasa al convertir una cotización en venta.
    state().setMode('sale-permissive');
    state().addItem(makeProduct({ id: 1, stock_actual: 2 }));
    state().updateQuantity(1, 10);
    state().setMode('sale-strict');

    const validation = state().validateCart();

    expect(validation.isValid).toBe(false);
    expect(validation.issues).toHaveLength(1);
    expect(validation.issues[0]).toMatchObject({
      productId: 1,
      currentQuantity: 10,
      availableStock: 2,
      issue: 'QUANTITY_EXCEEDS_STOCK',
    });
  });

  it('detecta las líneas sin stock', () => {
    state().setMode('sale-permissive');
    state().addItem(makeProduct({ id: 1, stock_actual: 0 }));
    state().setMode('sale-strict');

    const validation = state().validateCart();

    expect(validation.isValid).toBe(false);
    expect(validation.issues[0].issue).toBe('NO_STOCK');
  });
});

describe('conversión a sale-strict', () => {
  /**
   * Es el paso de cotización a venta: lo que no tiene stock se cae y lo que
   * excede se recorta. Acá se decide qué se factura.
   */

  beforeEach(() => state().setMode('quote'));

  it('quita los productos sin stock', () => {
    state().addItem(makeProduct({ id: 1, stock_actual: 0 }));
    state().addItem(makeProduct({ id: 2, stock_actual: 5 }));

    const result = state().convertToSaleStrict();

    expect(result.removedItems).toHaveLength(1);
    expect(result.removedItems[0].product.id).toBe(1);
    expect(state().items.map((i) => i.product.id)).toEqual([2]);
  });

  it('recorta la cantidad al stock disponible y recalcula el subtotal', () => {
    state().addItem(makeProduct({ id: 1, stock_actual: 3, precio_venta: 100 }));
    state().updateQuantity(1, 10);

    const result = state().convertToSaleStrict();

    expect(result.adjustedItems).toHaveLength(1);
    expect(state().getItemQuantity(1)).toBe(3);
    // El subtotal tiene que seguir a la cantidad recortada: 3 × 100.
    expect(state().getItemSubtotal(1)).toBe(300);
  });

  it('deja intacto lo que ya entraba en el stock', () => {
    state().addItem(makeProduct({ id: 1, stock_actual: 10, precio_venta: 100 }));
    state().updateQuantity(1, 4);

    const result = state().convertToSaleStrict();

    expect(result.removedItems).toHaveLength(0);
    expect(result.adjustedItems).toHaveLength(0);
    expect(state().getItemSubtotal(1)).toBe(400);
  });

  it('previewConversion no modifica el carrito', () => {
    state().addItem(makeProduct({ id: 1, stock_actual: 0 }));
    const before = state().items.length;

    const preview = state().previewConversion('sale-strict');

    expect(preview.removedCount).toBe(1);
    expect(state().items).toHaveLength(before);
  });
});
