import { useCallback, useState } from "react";
import { useUpdatePurchaseDetailPrices } from "@/modules/purchases/hooks/useUpdatePurchaseDetailPrices";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import {
  dividePrecise,
  multiplyPrecise,
  roundTo5Decimals,
} from "@/utils/decimalUtils";
import type { UpdatePurchaseDetailPricesFormData } from "@/modules/purchases/types/UpdatePurchaseDetailPrices.types";
import type { ProductStock } from "../types/productStock";

// Margen porcentual de `final` sobre `base` — misma fórmula que useUpdatePriceForm,
// para que el payload sea idéntico al del modal y el backend no recalcule distinto.
const calcIncrement = (base: number, final: number): number => {
  if (base === 0) return 0;
  return multiplyPrecise(dividePrecise(final - base, base), 100);
};

export type PriceField = "precio_venta" | "precio_venta_alt";

interface PriceDraft {
  precio_venta?: number;
  precio_venta_alt?: number;
}

// Arma el payload de update_prices para UN lote. El costo NUNCA se envía:
// solo se usa como base para el incremento. detalles = [id] → corrección quirúrgica.
const buildPayload = (
  detail: ProductStock,
  draft: PriceDraft
): UpdatePurchaseDetailPricesFormData => {
  const precio_venta = roundTo5Decimals(
    draft.precio_venta ?? detail.precio_venta
  );
  const precio_venta_alt = roundTo5Decimals(
    draft.precio_venta_alt ?? detail.precio_venta_alt
  );
  return {
    precio_venta,
    precio_venta_alt,
    incremento_p_venta: calcIncrement(detail.costo, precio_venta),
    incremento_p_venta_alt: calcIncrement(precio_venta, precio_venta_alt),
    detalles: [detail.id],
  };
};

const draftIsEmpty = (detail: ProductStock, draft: PriceDraft): boolean => {
  const pv = draft.precio_venta ?? detail.precio_venta;
  const pva = draft.precio_venta_alt ?? detail.precio_venta_alt;
  return (
    roundTo5Decimals(pv) === roundTo5Decimals(detail.precio_venta) &&
    roundTo5Decimals(pva) === roundTo5Decimals(detail.precio_venta_alt)
  );
};

/**
 * Borrador local de precios para edición inline en las tablas de stock del
 * detalle de producto. Los cambios NO pegan al API hasta que se llama a
 * `save()` — evita guardados accidentales por blur. Cada lote se persiste con
 * `detalles: [id]` (corrección de un solo lote).
 */
export const useStockPriceDrafts = () => {
  const { mutateAsync, isPending } = useUpdatePurchaseDetailPrices();
  const [drafts, setDrafts] = useState<Record<number, PriceDraft>>({});

  // Valor a mostrar en la celda: el del borrador si existe, si no el original.
  const getFieldValue = useCallback(
    (detail: ProductStock, field: PriceField): number =>
      drafts[detail.id]?.[field] ?? detail[field],
    [drafts]
  );

  const setDraftField = useCallback(
    (detail: ProductStock, field: PriceField, value: number) => {
      setDrafts((prev) => {
        const next: PriceDraft = { ...prev[detail.id], [field]: value };
        // Si vuelve al valor original en ambos campos, descartamos el borrador.
        if (draftIsEmpty(detail, next)) {
          const { [detail.id]: _omit, ...rest } = prev;
          return rest;
        }
        return { ...prev, [detail.id]: next };
      });
    },
    []
  );

  const isDirty = useCallback((id: number): boolean => id in drafts, [drafts]);

  const dirtyCount = Object.keys(drafts).length;

  const discard = useCallback(() => setDrafts({}), []);

  // Guarda todos los borradores. Un lote = una llamada (cada lote tiene su precio).
  const save = useCallback(
    async (details: ProductStock[]) => {
      const byId = new Map(details.map((d) => [d.id, d]));
      const entries = Object.entries(drafts);
      if (entries.length === 0) return;

      const results = await Promise.allSettled(
        entries.map(([id, draft]) => {
          const detail = byId.get(Number(id));
          if (!detail) return Promise.resolve();
          return mutateAsync(buildPayload(detail, draft));
        })
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      const ok = results.length - failed;

      if (ok > 0) {
        showSuccessToast({
          title: "Precios actualizados",
          description: `${ok} lote(s) actualizado(s)${
            failed > 0 ? `, ${failed} con error` : ""
          }`,
        });
      }
      if (failed > 0 && ok === 0) {
        showErrorToast({
          title: "Error al actualizar precios",
          description: `No se pudo actualizar ${failed} lote(s)`,
        });
      }

      // Limpiamos solo los que se guardaron bien; los que fallaron quedan en borrador.
      setDrafts((prev) => {
        const next = { ...prev };
        entries.forEach(([id], i) => {
          if (results[i].status === "fulfilled") delete next[Number(id)];
        });
        return next;
      });
    },
    [drafts, mutateAsync]
  );

  return {
    getFieldValue,
    setDraftField,
    isDirty,
    dirtyCount,
    discard,
    save,
    isSaving: isPending,
  };
};
