/**
 * Agregar un producto a una transferencia exige stock en la sucursal de
 * origen. Antes, sin stock (o si fallaba la consulta) se agregaba igual con
 * cantidad 1 y sin lote, y al recibirla aparecía stock en el destino que no
 * salió de ningún lote del origen.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductStock } from '@/modules/products/types/productStock';

const getStock = vi.hoisted(() => vi.fn());
const toasts = vi.hoisted(() => ({ warning: vi.fn(), error: vi.fn() }));

vi.mock('@/modules/products/services/productService', () => ({
  productsService: { getStock },
}));
vi.mock('@/hooks/use-toast-enhanced', () => ({
  showWarningToast: toasts.warning,
  showErrorToast: toasts.error,
}));

import {
  availableLotsFifo,
  fetchOriginLots,
  notifyProductNotAdded,
} from '../transferOriginStock';

const lot = (id: number, saldo: number, fecha: string): ProductStock => ({
  id,
  cantidad: 10,
  costo: 50,
  precio_venta: 100,
  precio_venta_alt: 90,
  saldo,
  nro_adquisicion: id,
  fecha_adquisicion: fecha,
  fecha_actualizacion: null,
  tipo: 'COMPRA',
  sucursal: 'Central',
  tc_compra: 6.96,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('availableLotsFifo', () => {
  it('descarta lotes sin saldo y ordena del más antiguo al más nuevo', () => {
    const lots = availableLotsFifo([
      lot(3, 4, '2026-03-01'),
      lot(1, 0, '2026-01-01'),
      lot(2, 2, '2026-02-01'),
    ]);
    expect(lots.map((l) => l.id)).toEqual([2, 3]);
  });
});

describe('fetchOriginLots', () => {
  it('con saldo en origen: devuelve los lotes disponibles', async () => {
    getStock.mockResolvedValue([lot(7, 3, '2026-01-01')]);

    const result = await fetchOriginLots(101, 4);

    expect(getStock).toHaveBeenCalledWith({ producto: 101, sucursal: 4, resto_only: 0 });
    expect(result).toMatchObject({ status: 'available', lots: [{ id: 7, saldo: 3 }] });
  });

  it('stock 0 (sin lotes, o solo lotes agotados): no se puede transferir', async () => {
    getStock.mockResolvedValueOnce([]);
    expect(await fetchOriginLots(101, 4)).toEqual({ status: 'no-stock' });

    getStock.mockResolvedValueOnce([lot(7, 0, '2026-01-01')]);
    expect(await fetchOriginLots(101, 4)).toEqual({ status: 'no-stock' });
  });

  it('si no se pudo consultar el stock, no lo da por bueno', async () => {
    getStock.mockRejectedValue(new Error('Network Error'));
    expect(await fetchOriginLots(101, 4)).toMatchObject({ status: 'error' });
  });
});

describe('notifyProductNotAdded', () => {
  it('sin stock: avisa con el producto y la sucursal de origen', () => {
    notifyProductNotAdded('Filtro de aceite', { status: 'no-stock' }, 'Central');
    expect(toasts.warning).toHaveBeenCalledWith({
      title: 'Sin stock en origen',
      description: '«Filtro de aceite» no tiene stock en Central: no se puede transferir.',
    });
  });

  it('error al consultar: avisa que no se agregó', () => {
    notifyProductNotAdded('Filtro de aceite', { status: 'error', error: new Error('x') });
    expect(toasts.error).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'No se pudo verificar el stock' }),
    );
  });
});
