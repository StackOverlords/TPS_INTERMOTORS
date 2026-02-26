import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import type { ReportMasVendidoFilters } from "../../types/report.types";

const cleanFilters = (filters: ReportMasVendidoFilters): ReportMasVendidoFilters => ({
  ...filters,
  fecha_fin: filters.fecha_fin || undefined,
  sucursal: filters.sucursal ?? undefined,
  downloadable: filters.downloadable ?? false,
});

export const useSalesReportFilters = (defaultSucursal: number | null = null) => {
  const defaultDates = useMemo(() => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    return {
      today: today.toISOString().split('T')[0],
      lastMonth: lastMonth.toISOString().split('T')[0],
    };
  }, []);

  // ═══ FILTRO DE DATOS (backend) ═══
  const [filters, setFilters] = useState<ReportMasVendidoFilters>({
    fecha_inicio: defaultDates.lastMonth,
    fecha_fin: defaultDates.today,
    ranking: 50, // Cuántos registros traer del servidor
    sucursal: defaultSucursal,
    downloadable: false,
  });

  const [chartVisualLimit, setChartVisualLimit] = useState(20);

  const [appliedFilters, setAppliedFilters] = useState<ReportMasVendidoFilters>(filters);
  const [debouncedFilters] = useDebounce(filters, 500);

  const cleanedDebouncedFilters = useMemo(
    () => cleanFilters(debouncedFilters),
    [debouncedFilters]
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
    <K extends keyof ReportMasVendidoFilters>(
      key: K,
      value: ReportMasVendidoFilters[K]
    ) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    const emptyFilters: ReportMasVendidoFilters = {
      fecha_inicio: defaultDates.lastMonth,
      fecha_fin: defaultDates.today,
      ranking: 50,
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
  const adjustChartLimitToData = useCallback((dataLength: number) => {
    if (dataLength < chartVisualLimit && dataLength > 0) {
      setChartVisualLimit(Math.min(dataLength, 100));
    }
  }, [chartVisualLimit]);

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