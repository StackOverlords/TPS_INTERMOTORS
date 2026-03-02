import { useState, useEffect, useMemo, useCallback } from "react";
import { useDebounce } from "use-debounce";
import type { KardexReportFilters } from "../../types/kardexReport.types";

const cleanFilters = (filters: KardexReportFilters): KardexReportFilters => ({
  ...filters,
  fecha_inicio: filters.fecha_inicio || undefined,
  fecha_fin: filters.fecha_fin || undefined,
  sucursal: filters.sucursal ?? undefined,
  downloadable: filters.downloadable ?? false,
});

export const useKardexReportFilters = (
  defaultSucursal: number | null = null,
) => {
  const defaultDates = useMemo(() => {
    const today = new Date();
    const lastThreeMonths = new Date(today);
    lastThreeMonths.setMonth(today.getMonth() - 3);

    return {
      today: today.toISOString().split("T")[0],
      lastThreeMonths: lastThreeMonths.toISOString().split("T")[0],
    };
  }, []);

  // ═══ FILTRO DE DATOS (backend) ═══
  const [filters, setFilters] = useState<KardexReportFilters>({
    producto: 0,
    fecha_inicio: defaultDates.lastThreeMonths,
    fecha_fin: defaultDates.today,
    sucursal: defaultSucursal,
    downloadable: false,
  });

  const [chartVisualLimit, setChartVisualLimit] = useState(20);

  const [appliedFilters, setAppliedFilters] =
    useState<KardexReportFilters>(filters);
  const [debouncedFilters] = useDebounce(filters, 500);

  const cleanedDebouncedFilters = useMemo(
    () => cleanFilters(debouncedFilters),
    [debouncedFilters],
  );

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      sucursal: defaultSucursal,
    }));
    setAppliedFilters((prev) => ({
      ...prev,
      sucursal: defaultSucursal,
    }));
  }, [defaultSucursal]);

  const updateFilter = useCallback(
    <K extends keyof KardexReportFilters>(
      key: K,
      value: KardexReportFilters[K],
    ) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    const emptyFilters: KardexReportFilters = {
      producto: 0,
      fecha_inicio: defaultDates.lastThreeMonths,
      fecha_fin: defaultDates.today,
      sucursal: defaultSucursal,
      downloadable: false,
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setChartVisualLimit(20); // Reset también el límite visual
  }, [defaultSucursal, defaultDates]);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  // Auto-ajustar chartVisualLimit cuando los datos cargados son menos
  const adjustChartLimitToData = useCallback(
    (dataLength: number) => {
      if (dataLength < chartVisualLimit && dataLength > 0) {
        setChartVisualLimit(Math.min(dataLength, 100));
      }
    },
    [chartVisualLimit],
  );

  return {
    filters,
    debouncedFilters: cleanedDebouncedFilters,
    appliedFilters: cleanFilters(appliedFilters),
    chartVisualLimit,
    setChartVisualLimit,
    updateFilter,
    resetFilters,
    setFilters,
    applyFilters,
    adjustChartLimitToData,
  };
};
