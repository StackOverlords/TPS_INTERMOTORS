import type { ReportItem } from '../types/report.types';
import type { ReportMetrics } from '../types/reportMetrics.types';

/**
 * Parsear un item del reporte (strings a números)
 */
export function parseReportItem(item: ReportItem): ReportItem {
  return {
    sucursal: item.sucursal,
    codigo: item.codigo,
    producto: item.producto,
    cantidad: item.cantidad,
    precio_medio: item.precio_medio,
    subtotal: item.subtotal,
    subtotal_descuento: item.subtotal_descuento,
    total: item.total,
  };
}

/**
 * Parsear todos los items de un reporte
 */
export function parseReportItems(items: ReportItem[]): ReportItem[] {
  return items.map(parseReportItem);
}

/**
 * Calcular métricas agregadas de un reporte
 */
export function calculateMetrics(items: ReportItem[]): ReportMetrics {
  if (!items || items.length === 0) {
    return {
      totalVentas: 0,
      productosVendidos: 0,
      lineasVenta: 0,
      ticketPromedio: 0,
    };
  }

  const totalVentas = items.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const productosVendidos = items.reduce(
    (sum, item) => sum + item.cantidad,
    0
  );

  const lineasVenta = items.length;

  const ticketPromedio = totalVentas / lineasVenta;

  return {
    totalVentas,
    productosVendidos,
    lineasVenta,
    ticketPromedio,
  };
}

/**
 * Calcular porcentaje de crecimiento
 */
export function calculateGrowth(
  current: number,
  previous: number | undefined | null
): number | null {
  if (previous === undefined || previous === null || previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Formatear número con separadores de miles
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formatear número de forma corta (K, M)
 */
export function formatNumberShort(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return formatNumber(num);
}

/**
 * Truncar texto
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Calcular mediana de un array de números
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}