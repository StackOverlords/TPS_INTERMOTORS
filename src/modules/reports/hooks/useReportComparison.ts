import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { subDays, differenceInDays, format } from 'date-fns';
import { reportService } from '../services/reportService';
import type { ReportGeneralFilters } from '../types/report.types';
import type { PeriodComparisonMetrics } from '../types/reportMetrics.types';
import { calculateMetrics, calculateGrowth } from '../utils/reportUtils';

export interface UseReportComparisonOptions {
  filters: ReportGeneralFilters;
  enabled?: boolean;
}

/**
 * Hook para comparar métricas entre dos períodos
 * Hace 2 llamadas paralelas: período actual y período anterior
 */
export function useReportComparison({
  filters,
  enabled = true,
}: UseReportComparisonOptions) {
  // Calcular período anterior
  const previousPeriod = useMemo(() => {
    if (!filters.fecha_inicio || !filters.fecha_fin) return null;

    const days = differenceInDays(
      new Date(filters.fecha_fin),
      new Date(filters.fecha_inicio)
    );

    const previousEnd = subDays(new Date(filters.fecha_inicio), 1);
    const previousStart = subDays(previousEnd, days);

    return {
      fecha_inicio: format(previousStart, 'yyyy-MM-dd'),
      fecha_fin: format(previousEnd, 'yyyy-MM-dd'),
    };
  }, [filters.fecha_inicio, filters.fecha_fin]);

  // Hacer 2 queries en paralelo
  const queries = useQueries({
    queries: [
      {
        queryKey: ['report-comparison', 'current', filters],
        queryFn: () => reportService.getGeneral(filters),
        enabled: enabled && !!filters.fecha_inicio,
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: ['report-comparison', 'previous', previousPeriod, filters.sucursal],
        queryFn: () =>
          reportService.getGeneral({
            ...previousPeriod!,
            sucursal: filters.sucursal,
          }),
        enabled: enabled && !!previousPeriod,
        staleTime: 1000 * 60 * 5,
      },
    ],
  });

  const [currentQuery, previousQuery] = queries;

  // Calcular métricas comparadas
  const comparison = useMemo<PeriodComparisonMetrics | null>(() => {
    if (!currentQuery.data) return null;

    const currentMetrics = calculateMetrics(currentQuery.data.data);
    const previousMetrics = previousQuery.data
      ? calculateMetrics(previousQuery.data.data)
      : null;

    return {
      current: currentMetrics,
      previous: previousMetrics,
      growth: {
        totalVentas: calculateGrowth(
          currentMetrics.totalVentas,
          previousMetrics?.totalVentas
        ),
        productosVendidos: calculateGrowth(
          currentMetrics.productosVendidos,
          previousMetrics?.productosVendidos
        ),
        lineasVenta: calculateGrowth(
          currentMetrics.lineasVenta,
          previousMetrics?.lineasVenta
        ),
        ticketPromedio: calculateGrowth(
          currentMetrics.ticketPromedio,
          previousMetrics?.ticketPromedio
        ),
      },
    };
  }, [currentQuery.data, previousQuery.data]);

  return {
    comparison,
    currentData: currentQuery.data,
    previousData: previousQuery.data,
    isLoading: currentQuery.isLoading || previousQuery.isLoading,
    isError: currentQuery.isError || previousQuery.isError,
    error: currentQuery.error || previousQuery.error,
    previousPeriod,
  };
}