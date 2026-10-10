import { showErrorToast, showWarningToast } from "@/hooks/use-toast-enhanced";
import { productsService } from "@/modules/products/services/productService";
import type { ProductStock } from "@/modules/products/types/productStock";

/**
 * Lotes con saldo, del más antiguo al más nuevo: la salida de la
 * transferencia se reparte FIFO para reflejar el costo real por lote.
 */
export function availableLotsFifo(stock: ReadonlyArray<ProductStock>): ProductStock[] {
  return stock
    .filter((lot) => Number(lot.saldo) > 0)
    .sort(
      (a, b) =>
        new Date(a.fecha_adquisicion).getTime() -
        new Date(b.fecha_adquisicion).getTime(),
    );
}

export type OriginLotsResult =
  | { status: "available"; lots: ProductStock[] }
  | { status: "no-stock" }
  | { status: "error"; error: unknown };

/**
 * Stock del producto en la sucursal de origen de la transferencia.
 *
 * Sin saldo, o si no se pudo consultar, el producto NO se agrega: antes se
 * agregaba igual con cantidad 1 y sin lote, y al recibirla aparecía en el
 * destino una unidad que no salió de ningún lote del origen.
 */
export async function fetchOriginLots(
  productId: number,
  originBranchId: number,
): Promise<OriginLotsResult> {
  try {
    const stock = await productsService.getStock({
      producto: productId,
      sucursal: originBranchId,
      resto_only: 0,
    });
    const lots = availableLotsFifo(stock);
    return lots.length > 0 ? { status: "available", lots } : { status: "no-stock" };
  } catch (error) {
    return { status: "error", error };
  }
}

/** Aviso de por qué un producto no se agregó a la transferencia. */
export function notifyProductNotAdded(
  productName: string,
  result: Exclude<OriginLotsResult, { status: "available" }>,
  originBranchName?: string,
): void {
  if (result.status === "no-stock") {
    showWarningToast({
      title: "Sin stock en origen",
      description: `«${productName}» no tiene stock en ${originBranchName ?? "la sucursal de origen"}: no se puede transferir.`,
    });
    return;
  }
  showErrorToast({
    title: "No se pudo verificar el stock",
    description: `No se agregó «${productName}». Revisa la conexión e intenta de nuevo.`,
  });
}
