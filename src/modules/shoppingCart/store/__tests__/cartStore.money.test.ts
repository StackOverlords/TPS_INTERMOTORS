import { beforeEach, describe, expect, it } from 'vitest';

import { createCartStore, type CartStore } from '../cartStore';
import { makeProduct } from './cartProduct.fixture';

/**
 * Tests de CARACTERIZACIÓN del carrito — la parte que toca plata.
 *
 * No describen cómo "debería" calcular el carrito: congelan lo que hace HOY.
 * Ese es el punto. Estas 930 líneas calculan lo que se le cobra al cliente y
 * no tenían ni un test; antes de refactorizar las pantallas de venta que las
 * consumen, hace falta una red que avise si el comportamiento cambia.
 *
 * Si alguno de estos tests falla después de un cambio, hay dos lecturas
 * posibles y conviene decidir cuál es antes de tocar el test:
 *   1. Se rompió algo → arreglar el código.
 *   2. El comportamiento cambió a propósito → actualizar el test Y el commit
 *      debe explicar por qué el cálculo viejo estaba mal.
 */

let store: CartStore;

/** Atajos para no repetir `store.getState()` en cada línea. */
const state = () => store.getState();
const subtotal = () => state().getCartSubtotal();
const total = () => state().getCartTotal();

beforeEach(() => {
  sessionStorage.clear();
  // Un usuario distinto por test: el store persiste por usuario y sin esto
  // el estado de un test se filtraría al siguiente.
  store = createCartStore(`test-${Math.random()}`);
  state().setMode('sale-permissive');
});

describe('subtotales por línea', () => {
  it('el subtotal de una línea es precio × cantidad', () => {
    state().addItem(makeProduct({ precio_venta: 250 }));
    state().updateQuantity(1, 3);

    expect(state().getItemSubtotal(1)).toBe(750);
  });

  it('el subtotal del carrito suma todas las líneas', () => {
    state().addItem(makeProduct({ id: 1, precio_venta: 100 }));
    state().addItem(makeProduct({ id: 2, precio_venta: 250 }));
    state().updateQuantity(2, 2);

    expect(subtotal()).toBe(600); // 100 + 500
  });

  it('no acumula error de punto flotante con decimales', () => {
    // 0.1 + 0.2 en coma flotante da 0.30000000000000004. El store usa
    // decimalUtils justamente para que esto no le pase a los totales.
    state().addItem(makeProduct({ id: 1, precio_venta: 0.1 }));
    state().addItem(makeProduct({ id: 2, precio_venta: 0.2 }));

    expect(subtotal()).toBe(0.3);
  });

  it('un carrito vacío tiene subtotal y total en cero', () => {
    expect(subtotal()).toBe(0);
    expect(total()).toBe(0);
    expect(state().getCartCount()).toBe(0);
  });
});

describe('precio y subtotal editables por línea', () => {
  it('cambiar el precio recalcula el subtotal de esa línea', () => {
    state().addItem(makeProduct({ precio_venta: 100 }));
    state().updateQuantity(1, 4);

    state().updateCustomPrice(1, 90);

    expect(state().getItemSubtotal(1)).toBe(360);
    expect(subtotal()).toBe(360);
  });

  it('cambiar el subtotal deriva el precio unitario hacia atrás', () => {
    // El vendedor escribe el total de la línea y el precio se despeja solo.
    state().addItem(makeProduct({ precio_venta: 100 }));
    state().updateQuantity(1, 4);

    state().updateCustomSubtotal(1, 350);

    const item = state().items[0];
    expect(item.customSubtotal).toBe(350);
    expect(item.customPrice).toBe(87.5);
  });

  it('ignora un subtotal NaN o nulo en vez de corromper la línea', () => {
    state().addItem(makeProduct({ precio_venta: 100 }));

    state().updateCustomSubtotal(1, NaN);

    expect(state().items[0].customSubtotal).toBe(100);
  });

  it('el precio editado sobrevive a un cambio de cantidad', () => {
    state().addItem(makeProduct({ precio_venta: 100 }));
    state().updateCustomPrice(1, 80);

    state().updateQuantity(1, 3);

    expect(state().items[0].customPrice).toBe(80);
    expect(state().getItemSubtotal(1)).toBe(240);
  });
});

describe('descuento por monto', () => {
  beforeEach(() => {
    state().addItem(makeProduct({ precio_venta: 100 }));
    state().updateQuantity(1, 10); // subtotal = 1000
  });

  it('resta el monto del total y deriva el porcentaje', () => {
    state().setDiscountAmount(250);

    expect(total()).toBe(750);
    expect(state().discountPercent).toBe(25);
    expect(state().discountMode).toBe('amount');
  });

  it('topea el descuento al subtotal: el total nunca es negativo', () => {
    state().setDiscountAmount(5000);

    expect(state().discountAmount).toBe(1000);
    expect(total()).toBe(0);
  });

  it('ignora montos negativos', () => {
    state().setDiscountAmount(-100);

    expect(state().discountAmount).toBe(0);
    expect(total()).toBe(1000);
  });
});

describe('descuento por porcentaje', () => {
  beforeEach(() => {
    state().addItem(makeProduct({ precio_venta: 100 }));
    state().updateQuantity(1, 10); // subtotal = 1000
  });

  it('deriva el monto desde el porcentaje', () => {
    state().setDiscountPercent(15);

    expect(state().discountAmount).toBe(150);
    expect(total()).toBe(850);
    expect(state().discountMode).toBe('percent');
  });

  it('topea el porcentaje en 100', () => {
    state().setDiscountPercent(150);

    expect(state().discountPercent).toBe(100);
    expect(state().discountAmount).toBe(1000);
    expect(total()).toBe(0);
  });

  it('ignora porcentajes negativos', () => {
    state().setDiscountPercent(-20);

    expect(state().discountPercent).toBe(0);
    expect(total()).toBe(1000);
  });
});

describe('el descuento se recalcula al cambiar el carrito', () => {
  /**
   * Acá está la diferencia de comportamiento que más importa entender: los dos
   * modos de descuento reaccionan distinto cuando el subtotal cambia.
   */

  it('en modo PORCENTAJE, el monto sigue al subtotal', () => {
    state().addItem(makeProduct({ id: 1, precio_venta: 100 }));
    state().updateQuantity(1, 10); // subtotal 1000
    state().setDiscountPercent(10); // 100 de descuento

    state().addItem(makeProduct({ id: 2, precio_venta: 500 })); // subtotal 1500

    // El 10% se mantiene y el monto sube solo.
    expect(state().discountPercent).toBe(10);
    expect(state().discountAmount).toBe(150);
    expect(total()).toBe(1350);
  });

  it('en modo MONTO, el monto se mantiene y el porcentaje se recalcula', () => {
    state().addItem(makeProduct({ id: 1, precio_venta: 100 }));
    state().updateQuantity(1, 10); // subtotal 1000
    state().setDiscountAmount(100); // 10%

    state().addItem(makeProduct({ id: 2, precio_venta: 1000 })); // subtotal 2000

    // Los 100 de descuento no se mueven; ahora representan el 5%.
    expect(state().discountAmount).toBe(100);
    expect(state().discountPercent).toBe(5);
    expect(total()).toBe(1900);
  });

  it('en modo MONTO, el descuento se achica si el carrito se achica', () => {
    state().addItem(makeProduct({ id: 1, precio_venta: 100 }));
    state().updateQuantity(1, 10); // subtotal 1000
    state().setDiscountAmount(800);

    state().updateQuantity(1, 5); // subtotal 500

    // Sin este tope el total quedaría en -300.
    expect(state().discountAmount).toBe(500);
    expect(total()).toBe(0);
  });

  it('quitar el último producto deja el descuento en cero', () => {
    state().addItem(makeProduct({ precio_venta: 100 }));
    state().setDiscountPercent(50);

    state().removeItem(1);

    expect(subtotal()).toBe(0);
    expect(total()).toBe(0);
    expect(state().discountAmount).toBe(0);
  });

  it('sin descuento aplicado, agregar productos no lo inventa', () => {
    state().addItem(makeProduct({ precio_venta: 100 }));

    expect(state().discountMode).toBeNull();
    expect(state().discountAmount).toBe(0);
    expect(total()).toBe(subtotal());
  });
});

describe('clearCart', () => {
  it('vacía los items y resetea el descuento', () => {
    state().addItem(makeProduct({ precio_venta: 100 }));
    state().setDiscountPercent(20);

    state().clearCart();

    expect(state().items).toEqual([]);
    expect(state().discountAmount).toBe(0);
    expect(state().discountPercent).toBe(0);
    expect(state().discountMode).toBeNull();
    expect(total()).toBe(0);
  });
});
