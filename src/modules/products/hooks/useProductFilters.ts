import { useCallback, useState, useMemo, useEffect } from "react";
import { useDebounce } from "use-debounce";
import type { ProductFilters } from "../types/productFilters";

// Helper para limpiar filtros opcionales
const cleanFilters = (filters: ProductFilters): ProductFilters => ({
  ...filters,
  descripcion: filters.descripcion || undefined,
  codigo_oem: filters.codigo_oem || undefined,
  codigo_upc: filters.codigo_upc || undefined,
  medida: filters.medida || undefined,
  nro_motor: filters.nro_motor || undefined,
  marca: filters.marca || undefined,
});

export const useProductFilters = (defaultSucursal: number, defaultPageSize = 25) => {
  const [filters, setFilters] = useState<ProductFilters>({
    pagina: 1,
    pagina_registros: defaultPageSize,
    sucursal: defaultSucursal,
    descripcion: "",
    codigo_oem: "",
    codigo_upc: "",
    medida: "",
    nro_motor: "",
    marca: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(filters);
  const [debouncedFilters] = useDebounce(filters, 500);

  const cleanedDebouncedFilters = useMemo(
    () => cleanFilters(debouncedFilters),
    [debouncedFilters],
  );

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      sucursal: defaultSucursal,
      pagina: 1,
    }));
    setAppliedFilters((prev) => ({
      ...prev,
      sucursal: defaultSucursal,
      pagina: 1,
    }));
  }, [defaultSucursal]);

  const updateFilter = useCallback(
    (
      key: keyof ProductFilters,
      value: ProductFilters[keyof ProductFilters],
    ) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        pagina:
          key === "pagina" || key === "pagina_registros" ? prev.pagina : 1,
      }));
    },
    [],
  );

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
    const emptyFilters: ProductFilters = {
      pagina: 1,
      pagina_registros: defaultPageSize,
      sucursal: defaultSucursal,
      descripcion: "",
      codigo_oem: "",
      codigo_upc: "",
      medida: "",
      nro_motor: "",
      marca: "",
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }, [defaultSucursal]);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filters, pagina: 1 }); // Reset página al aplicar
  }, [filters]);

  return {
    filters,
    debouncedFilters: cleanedDebouncedFilters,
    appliedFilters: cleanFilters(appliedFilters), // Limpiar también los aplicados
    updateFilter,
    setPage,
    setPageSize,
    resetFilters,
    setFilters,
    applyFilters,
  };
};
