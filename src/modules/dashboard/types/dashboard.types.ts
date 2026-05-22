// ========================================
// DASHBOARD — TypeScript Interfaces
// ========================================

// ── Trend ─────────────────────────────────────────────────────────────────

/** A single data point from tendencia_diaria (30-day daily sales array). */
export interface TrendPoint {
  fecha: string; // 'YYYY-MM-DD'
  total: number;
}

// ── KPIs ──────────────────────────────────────────────────────────────────

/** Ventas KPIs for the selected period. */
export interface VentasKpis {
  total_ventas: number;
  total_transacciones: number;
  ticket_promedio: number;
  /** null when there is no prior period to compare against */
  delta_porcentaje: number | null;
}

/** Margen bruto KPIs. Null at the root level when the query timed out or errored. */
export interface MargenKpis {
  utilidad_total: number;
  porcentaje_margen: number;
}

/** Caja hoy: ingresos, egresos and net balance for today's cash sessions. */
export interface CajaHoyKpis {
  ingresos: number;
  egresos: number;
  saldo_neto: number;
}

/** Cotizaciones KPIs aggregated for the selected period. */
export interface CotizacionesKpis {
  total: number;
  convertidas: number;
  tasa_conversion: number;
}

/** Full KPI response shape from GET /dashboard/kpis (unwrapped from `data`). */
export interface KpisResponse {
  ventas: VentasKpis;
  /** null when the margen query timed out or encountered an error */
  margen: MargenKpis | null;
  caja_hoy: CajaHoyKpis;
  cotizaciones: CotizacionesKpis;
  tendencia_diaria: TrendPoint[];
}

// ── Alertas ───────────────────────────────────────────────────────────────

export interface StockMinimoAlerta {
  count_criticos: number;
  count_cercanos: number;
}

export interface CxpAlerta {
  vencidas_count: number;
  vencidas_total: number;
  vence_7_dias_total: number;
}

export interface CxcAging {
  vencida_30_dias_count: number;
  vencida_30_dias_total: number;
  vencida_60_dias_count: number;
  vencida_60_dias_total: number;
}

export interface CotizacionesSinConvertir {
  mas_de_7_dias: number;
  mas_de_15_dias: number;
}

export interface PedidoTransito {
  nro: string;
  proveedor: string;
  fecha_llegada: string | null;
}

export interface PedidosEnTransito {
  count: number;
  items: PedidoTransito[];
}

/** Full alertas response shape from GET /dashboard/alertas (unwrapped from `data`). */
export interface AlertasResponse {
  stock_minimo: StockMinimoAlerta;
  cxp: CxpAlerta;
  cxc: CxcAging;
  cotizaciones_sin_convertir: CotizacionesSinConvertir;
  pedidos_en_transito: PedidosEnTransito;
}

// ── Feed ──────────────────────────────────────────────────────────────────

/** A single sale entry in the real-time feed. */
export interface FeedItem {
  nro: string;
  cliente: string;
  /** 'V' = venta, 'VC' = venta crédito, 'VR' = venta rápida */
  tipo: string;
  hora: string; // 'HH:MM'
  total: number;
  items: number;
}

/** Full feed response shape from GET /dashboard/feed (unwrapped from `data`). */
export interface FeedResponse {
  ventas_hoy: FeedItem[];
}

// ── Service Params ────────────────────────────────────────────────────────

/** Params accepted by getKpis — sucursal is required, date range is optional. */
export interface DashboardKpisParams {
  sucursalId: number;
  fechaInicio?: string; // 'YYYY-MM-DD'
  fechaFin?: string;    // 'YYYY-MM-DD'
}

/** Params accepted by getAlertas and getFeed — sucursal only. */
export interface DashboardScopeParams {
  sucursalId: number;
}
