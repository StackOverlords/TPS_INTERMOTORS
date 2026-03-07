import { useCallback, useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import type { PaginationParams } from "../types/paginationParams";

interface UseFiltersManagementOptions {
  /**
   * Delay en ms para el debounce. Default: 500ms.
   * Si es 0, debouncedFilters === filters (sin delay).
   */
  debounceMs?: number;
}

interface UseFiltersManagementReturn<T extends PaginationParams> {
  /** Filtros "en vivo" (lo que el usuario está escribiendo) */
  filters: T;
  /**
   * Filtros con debounce — úsalos para búsquedas en tiempo real.
   * Si no usas debounce, son iguales a `filters`.
   */
  debouncedFilters: T;
  /**
   * Filtros aplicados manualmente con `applyFilters()`.
   * Úsalos cuando tengas un botón "Buscar".
   */
  appliedFilters: T;
  setFilters: React.Dispatch<React.SetStateAction<T>>;
  updateFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetFilters: () => void;
  /**
   * Copia `filters` → `appliedFilters` y resetea la página a 1.
   * Llama esto al presionar el botón "Buscar".
   */
  applyFilters: () => void;
}

export function useFiltersManagement<T extends PaginationParams>(
  initialFilters: T,
  options: UseFiltersManagementOptions = {},
): UseFiltersManagementReturn<T> {
  const { debounceMs = 500 } = options;

  const [filters, setFilters] = useState<T>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<T>(initialFilters);

  // Debounce sobre el objeto completo de filtros
  const [rawDebouncedFilters] = useDebounce(filters, debounceMs);

  // Si debounceMs === 0, devolvemos filters directamente para evitar el delay
  const debouncedFilters = useMemo(
    () => (debounceMs === 0 ? filters : rawDebouncedFilters),
    [debounceMs, filters, rawDebouncedFilters],
  );

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Solo resetea página si el cambio no es de paginación
      pagina: key === "pagina" || key === "pagina_registros" ? prev.pagina : 1,
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, pagina: page }));
    setAppliedFilters((prev) => ({ ...prev, pagina: page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setFilters((prev) => ({ ...prev, pagina_registros: pageSize, pagina: 1 }));
    setAppliedFilters((prev) => ({
      ...prev,
      pagina_registros: pageSize,
      pagina: 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [initialFilters]);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filters, pagina: 1 });
  }, [filters]);

  return {
    filters,
    debouncedFilters,
    appliedFilters,
    setFilters,
    updateFilter,
    setPage,
    setPageSize,
    resetFilters,
    applyFilters,
  };
}
