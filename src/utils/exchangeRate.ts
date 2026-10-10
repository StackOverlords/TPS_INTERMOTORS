/**
 * T.C. con que se registró un documento (compra o pedido), tomado de sus
 * líneas: el más repetido entre los válidos (> 0). Devuelve `undefined` si
 * ninguna línea tiene T.C., para que la pantalla use su valor por defecto.
 */
export function documentExchangeRate(
  detalles: ReadonlyArray<{ tc_compra?: number | string | null }>,
): number | undefined {
  const counts = new Map<number, number>();
  for (const { tc_compra } of detalles) {
    const rate = Number(tc_compra);
    if (Number.isFinite(rate) && rate > 0) {
      counts.set(rate, (counts.get(rate) ?? 0) + 1);
    }
  }

  let best: number | undefined;
  let bestCount = 0;
  for (const [rate, count] of counts) {
    if (count > bestCount) {
      best = rate;
      bestCount = count;
    }
  }
  return best;
}
