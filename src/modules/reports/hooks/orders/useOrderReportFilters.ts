import { useState, useEffect, useMemo, useCallback } from "react";
import { useDebounce } from "use-debounce";
import type {
  OrderReportGeneralFilters,
  OrderReportTiempoMedioFilters,
  OrderReportTopProveedoresFilters,
} from "../../types/orderReport.types";

// ── Tipos internos ────────────────────────────────────────────────────────────

/**
 * Estado de filtros que engloba los campos de los tres reportes de pedidos.
 * `top_n` aplica solo al reporte de Top Proveedores.
 */
export interface OrderReportFiltersState {
  fecha_inicio: string;
  fecha_fin?: string;
  sucursal: number | null;
  top_n: number;
  downloadable: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const cleanFilters = (
  filters: OrderReportFiltersState,
): OrderReportFiltersState => ({
  ...filters,
  fecha_inicio: filters.fecha_inicio || "",
  fecha_fin: filters.fecha_fin || undefined,
  sucursal: filters.sucursal ?? null,
  downloadable: filters.downloadable ?? false,
});

const buildDefaultDates = () => {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(today.getMonth() - 3);

  return {
    today: today.toISOString().split("T")[0],
    threeMonthsAgo: threeMonthsAgo.toISOString().split("T")[0],
  };
};

// ── Hook principal ────────────────────────────────────────────────────────────

export const useOrderReportFilters = (
  defaultSucursal: number | null = null,
) => {
  const defaultDates = useMemo(() => buildDefaultDates(), []);

  const initialFilters: OrderReportFiltersState = {
    fecha_inicio: defaultDates.threeMonthsAgo,
    fecha_fin: defaultDates.today,
    sucursal: defaultSucursal,
    top_n: 10,
    downloadable: false,
  };

  const [filters, setFilters] =
    useState<OrderReportFiltersState>(initialFilters);

  const [appliedFilters, setAppliedFilters] =
    useState<OrderReportFiltersState>(initialFilters);

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
    <K extends keyof OrderReportFiltersState>(
      key: K,
      value: OrderReportFiltersState[K],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    const reset: OrderReportFiltersState = {
      fecha_inicio: defaultDates.threeMonthsAgo,
      fecha_fin: defaultDates.today,
      sucursal: defaultSucursal,
      top_n: 10,
      downloadable: false,
    };
    setFilters(reset);
    setAppliedFilters(reset);
  }, [defaultSucursal, defaultDates]);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  // ── Proyecciones por reporte ────────────────────────────────────────────────

  /**
   * Filtros listos para el reporte general (con downloadable).
   */
  const generalFilters: OrderReportGeneralFilters = useMemo(
    () => ({
      fecha_inicio: cleanedDebouncedFilters.fecha_inicio,
      fecha_fin: cleanedDebouncedFilters.fecha_fin,
      sucursal: cleanedDebouncedFilters.sucursal,
      downloadable: cleanedDebouncedFilters.downloadable,
    }),
    [cleanedDebouncedFilters],
  );

  const appliedGeneralFilters: OrderReportGeneralFilters = useMemo(
    () => ({
      fecha_inicio: appliedFilters.fecha_inicio,
      fecha_fin: appliedFilters.fecha_fin,
      sucursal: appliedFilters.sucursal,
      downloadable: false,
    }),
    [appliedFilters],
  );

  /**
   * Filtros listos para el reporte de top proveedores.
   */
  const topProveedoresFilters: OrderReportTopProveedoresFilters = useMemo(
    () => ({
      fecha_inicio: cleanedDebouncedFilters.fecha_inicio,
      fecha_fin: cleanedDebouncedFilters.fecha_fin,
      sucursal: cleanedDebouncedFilters.sucursal,
      top_n: cleanedDebouncedFilters.top_n,
    }),
    [cleanedDebouncedFilters],
  );

  /**
   * Filtros listos para el reporte de tiempo medio.
   */
  const tiempoMedioFilters: OrderReportTiempoMedioFilters = useMemo(
    () => ({
      fecha_inicio: cleanedDebouncedFilters.fecha_inicio,
      fecha_fin: cleanedDebouncedFilters.fecha_fin,
      sucursal: cleanedDebouncedFilters.sucursal,
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
    topProveedoresFilters,
    tiempoMedioFilters,

    // Acciones
    updateFilter,
    resetFilters,
    applyFilters,
  };
};
