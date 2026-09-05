import type { CartProduct } from '../../types/cart.types';

/**
 * Fábrica de productos para los tests del carrito.
 *
 * Los valores por defecto son deliberadamente "aburridos" —precio 100, stock
 * 10— para que cada test pueda calcular el resultado esperado de cabeza. Lo que
 * importa de un producto se pasa por `overrides` y queda a la vista en el test.
 */
export function makeProduct(overrides: Partial<CartProduct> = {}): CartProduct {
  return {
    id: 1,
    descripcion: 'PISTON TOYOTA 4AF',
    codigo_oem: '13101-16090',
    codigo_upc: '13101-16090',
    precio_venta: 100,
    precio_venta_alt: 120,
    stock_actual: 10,
    marca: 'TEIKIN',
    unidad_medida: 'UNIDAD',
    sucursal: 1,
    categoria: 'PISTON',
    medida: 'STD',
    ...overrides,
  } as CartProduct;
}
