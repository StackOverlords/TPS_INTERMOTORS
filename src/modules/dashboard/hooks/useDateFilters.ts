import { useState, useCallback } from "react";
import { subDays } from "date-fns";

export type DatePeriod = "7d" | "30d" | "90d" | "1y" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateFilterHook {
  globalRange: DateRange;
  setGlobalRange: (from: Date, to: Date) => void;
  getCardRange: (cardId: string) => DateRange;
  setCardPeriod: (cardId: string, period: DatePeriod | null) => void;
  getEffectiveRange: (cardId: string) => DateRange;
  resetCardFilter: (cardId: string) => void;
  resetAllCardFilters: () => void;
}

/**
 * Hook para manejar filtros de fecha con jerarquía:
 * 1. Filtro de card específico (mayor prioridad)
 * 2. Filtro global (fallback)
 */
export function useDateFilters(): DateFilterHook {
  // Filtro global (afecta a todos los cards por defecto)
  const [globalRange, setGlobalRangeState] = useState<DateRange>(() => ({
    from: subDays(new Date(), 30),
    to: new Date(),
  }));

  // Filtros específicos por card (sobreescriben el global)
  const [cardFilters, setCardFilters] = useState<Map<string, DatePeriod>>(
    new Map(),
  );

  // Actualizar rango global
  const setGlobalRange = useCallback((from: Date, to: Date) => {
    setGlobalRangeState({ from, to });
  }, []);

  // Convertir período a rango de fechas
  const periodToRange = useCallback(
    (period: DatePeriod): DateRange => {
      const now = new Date();
      switch (period) {
        case "7d":
          return { from: subDays(now, 7), to: now };
        case "30d":
          return { from: subDays(now, 30), to: now };
        case "90d":
          return { from: subDays(now, 90), to: now };
        case "1y":
          return { from: subDays(now, 365), to: now };
        case "custom":
          return globalRange;
        default:
          return globalRange;
      }
    },
    [globalRange],
  );

  // Establecer período específico para un card
  const setCardPeriod = useCallback(
    (cardId: string, period: DatePeriod | null) => {
      setCardFilters((prev) => {
        const next = new Map(prev);
        if (period === null) {
          next.delete(cardId);
        } else {
          next.set(cardId, period);
        }
        return next;
      });
    },
    [],
  );

  // Obtener rango específico del card (si existe)
  const getCardRange = useCallback(
    (cardId: string): DateRange => {
      const period = cardFilters.get(cardId);
      if (!period) return globalRange;
      return periodToRange(period);
    },
    [cardFilters, globalRange, periodToRange],
  );

  // Obtener rango efectivo (prioridad: card > global)
  const getEffectiveRange = useCallback(
    (cardId: string): DateRange => {
      return getCardRange(cardId);
    },
    [getCardRange],
  );

  // Resetear filtro de un card específico
  const resetCardFilter = useCallback((cardId: string) => {
    setCardFilters((prev) => {
      const next = new Map(prev);
      next.delete(cardId);
      return next;
    });
  }, []);

  // Resetear todos los filtros de cards
  const resetAllCardFilters = useCallback(() => {
    setCardFilters(new Map());
  }, []);

  return {
    globalRange,
    setGlobalRange,
    getCardRange,
    setCardPeriod,
    getEffectiveRange,
    resetCardFilter,
    resetAllCardFilters,
  };
}
