// Tipos para métricas calculadas

export interface ReportMetrics {
  totalVentas: number;
  productosVendidos: number;
  lineasVenta: number;
  ticketPromedio: number;
}

export interface PeriodComparisonMetrics {
  current: ReportMetrics;
  previous: ReportMetrics | null;
  growth: {
    totalVentas: number | null;
    productosVendidos: number | null;
    lineasVenta: number | null;
    ticketPromedio: number | null;
  };
}

export interface DescuentosMetrics {
  totalDescuentos: number;
  sinDescuento: number;
  conDescuento: number;
  porcentaje: number;
  productosConDescuento: number;
  promedioDescuento: number;
}

// Para el ScatterChart
export interface ScatterDataPoint {
  producto: string;
  cantidad: number;
  precio_medio: number;
  total: number;
  categoria?: 'premium' | 'nicho' | 'commodity' | 'bajo';
}

// Para el PieChart de distribución
export interface DistributionDataPoint {
  name: string;
  value: number;
  percent: number;
}