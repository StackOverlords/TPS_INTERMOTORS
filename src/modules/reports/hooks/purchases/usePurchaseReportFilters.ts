import { useState, useEffect, useMemo, useCallback } from "react";
import { useDebounce } from "use-debounce";
import type {
  PurchaseReportGeneralFilters,
  PurchaseReportMasCompradoFilters,
  PurchaseReportMayorCostoFilters,
} from "../../types/purchaseReport.types";

// ── Tipos internos ────────────────────────────────────────────────────────────

/**
 * Estado de filtros que engloba los campos de los tres reportes de compras.
 * `ranking` aplica solo a los reportes de Más Comprado y Mayor Costo.
 */
export interface PurchaseReportFiltersState {
  fecha_inicio: string;
  fecha_fin?: string;
  sucursal: number | null;
  ranking: number;
  downloadable: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const cleanFilters = (
  filters: PurchaseReportFiltersState,
): PurchaseReportFiltersState => ({
  ...filters,
  fecha_inicio: filters.fecha_inicio || "",
  fecha_fin: filters.fecha_fin || undefined,
  sucursal: filters.sucursal ?? null,
  downloadable: filters.downloadable ?? false,
});

const buildDefaultDates = () => {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  return {
    today: today.toISOString().split("T")[0],
    lastMonth: lastMonth.toISOString().split("T")[0],
  };
};

// ── Hook principal ────────────────────────────────────────────────────────────

export const usePurchaseReportFilters = (
  defaultSucursal: number | null = null,
) => {
  const defaultDates = useMemo(() => buildDefaultDates(), []);

  const initialFilters: PurchaseReportFiltersState = {
    fecha_inicio: defaultDates.lastMonth,
    fecha_fin: defaultDates.today,
    sucursal: defaultSucursal,
    ranking: 10,
    downloadable: false,
  };

  const [filters, setFilters] =
    useState<PurchaseReportFiltersState>(initialFilters);

  const [appliedFilters, setAppliedFilters] =
    useState<PurchaseReportFiltersState>(initialFilters);

  const [debouncedFilters] = useDebounce(filters, 500);

  const cleanedDebouncedFilters = useMemo(
    () => cleanFilters(debouncedFilters),
    [debouncedFilters],
  );

  // Sincronizar sucursal cuando cambia desde el contexto padre
  useEffect(() => {
    setFilters((prev) => ({ ...prev, sucursal: defaultSucursal }));
    setAppliedFilters((prev) => ({ ...prev, sucursal: defaultSucursal }));
  }, [defaultSucursal]);

  const updateFilter = useCallback(
    <K extends keyof PurchaseReportFiltersState>(
      key: K,
      value: PurchaseReportFiltersState[K],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    const reset: PurchaseReportFiltersState = {
      fecha_inicio: defaultDates.lastMonth,
      fecha_fin: defaultDates.today,
      sucursal: defaultSucursal,
      ranking: 10,
      downloadable: false,
    };
    setFilters(reset);
    setAppliedFilters(reset);
  }, [defaultSucursal, defaultDates]);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  // ── Proyecciones por reporte ──────────────────────────────────────────────

  /**
   * Filtros listos para el reporte general (debounced).
   */
  const generalFilters: PurchaseReportGeneralFilters = useMemo(
    () => ({
      fecha_inicio: cleanedDebouncedFilters.fecha_inicio,
      fecha_fin: cleanedDebouncedFilters.fecha_fin,
      sucursal: cleanedDebouncedFilters.sucursal,
      downloadable: cleanedDebouncedFilters.downloadable,
    }),
    [cleanedDebouncedFilters],
  );

  /**
   * Filtros aplicados manualmente para el reporte general.
   */
  const appliedGeneralFilters: PurchaseReportGeneralFilters = useMemo(
    () => ({
      fecha_inicio: appliedFilters.fecha_inicio,
      fecha_fin: appliedFilters.fecha_fin,
      sucursal: appliedFilters.sucursal,
      downloadable: false,
    }),
    [appliedFilters],
  );

  /**
   * Filtros listos para el reporte de más comprado (debounced).
   */
  const masCompradoFilters: PurchaseReportMasCompradoFilters = useMemo(
    () => ({
      fecha_inicio: cleanedDebouncedFilters.fecha_inicio,
      fecha_fin: cleanedDebouncedFilters.fecha_fin,
      sucursal: cleanedDebouncedFilters.sucursal,
      ranking: cleanedDebouncedFilters.ranking,
      downloadable: cleanedDebouncedFilters.downloadable,
    }),
    [cleanedDebouncedFilters],
  );

  /**
   * Filtros listos para el reporte de mayor costo (debounced).
   */
  const mayorCostoFilters: PurchaseReportMayorCostoFilters = useMemo(
    () => ({
      fecha_inicio: cleanedDebouncedFilters.fecha_inicio,
      fecha_fin: cleanedDebouncedFilters.fecha_fin,
      sucursal: cleanedDebouncedFilters.sucursal,
      ranking: cleanedDebouncedFilters.ranking,
      downloadable: cleanedDebouncedFilters.downloadable,
    }),
    [cleanedDebouncedFilters],
  );

  return {
    // Estado crudo
    filters,
    setFilters,

    // Filtros debounced (para queries automáticas)
    debouncedFilters: cleanedDebouncedFilters,

    // Filtros aplicados manualmente
    appliedFilters: cleanFilters(appliedFilters),

    // Proyecciones tipadas por reporte
    generalFilters,
    appliedGeneralFilters,
    masCompradoFilters,
    mayorCostoFilters,

    // Acciones
    updateFilter,
    resetFilters,
    applyFilters,
  };
};
