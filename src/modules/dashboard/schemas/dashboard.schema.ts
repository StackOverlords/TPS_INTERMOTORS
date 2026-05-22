import { z } from "zod";
import type {
  KpisResponse,
  AlertasResponse,
  FeedResponse,
} from "../types/dashboard.types";

// ── Shared ────────────────────────────────────────────────────────────────

/**
 * TrendPoint — fecha string + total as coerced number.
 * DB::select raw results from PHP can return numeric columns as strings.
 */
const TrendPointSchema = z.object({
  fecha: z.string(),
  total: z.coerce.number(),
});

// ── KPIs ──────────────────────────────────────────────────────────────────

const VentasKpisSchema = z.object({
  total_ventas: z.coerce.number(),
  total_transacciones: z.coerce.number(),
  ticket_promedio: z.coerce.number(),
  /** null when there is no prior period to compare (prior total = 0) */
  delta_porcentaje: z.coerce.number().nullable(),
});

const MargenKpisSchema = z.object({
  utilidad_total: z.coerce.number(),
  porcentaje_margen: z.coerce.number(),
});

const CajaHoyKpisSchema = z.object({
  ingresos: z.coerce.number(),
  egresos: z.coerce.number(),
  saldo_neto: z.coerce.number(),
});

const CotizacionesKpisSchema = z.object({
  total: z.coerce.number(),
  convertidas: z.coerce.number(),
  tasa_conversion: z.coerce.number(),
});

/**
 * KpisResponseSchema — validates the payload returned by GET /dashboard/kpis
 * after ApiService unwraps the `data` envelope.
 */
export const KpisResponseSchema = z.object({
  ventas: VentasKpisSchema,
  /** null when the margen query timed out or encountered an error */
  margen: MargenKpisSchema.nullable(),
  caja_hoy: CajaHoyKpisSchema,
  cotizaciones: CotizacionesKpisSchema,
  tendencia_diaria: z.array(TrendPointSchema),
}) satisfies z.ZodType<KpisResponse>;

// ── Alertas ───────────────────────────────────────────────────────────────

const StockMinimoAlertaSchema = z.object({
  count_criticos: z.coerce.number(),
  count_cercanos: z.coerce.number(),
});

const CxpAlertaSchema = z.object({
  vencidas_count: z.coerce.number(),
  vencidas_total: z.coerce.number(),
  vence_7_dias_total: z.coerce.number(),
});

const CxcAgingSchema = z.object({
  vencida_30_dias_count: z.coerce.number(),
  vencida_30_dias_total: z.coerce.number(),
  vencida_60_dias_count: z.coerce.number(),
  vencida_60_dias_total: z.coerce.number(),
});

const CotizacionesSinConvertirSchema = z.object({
  mas_de_7_dias: z.coerce.number(),
  mas_de_15_dias: z.coerce.number(),
});

const PedidoTransitoSchema = z.object({
  nro: z.string(),
  proveedor: z.string(),
  fecha_llegada: z.string().nullable(),
});

const PedidosEnTransitoSchema = z.object({
  count: z.coerce.number(),
  items: z.array(PedidoTransitoSchema),
});

/**
 * AlertasResponseSchema — validates the payload returned by GET /dashboard/alertas
 * after ApiService unwraps the `data` envelope.
 */
export const AlertasResponseSchema = z.object({
  stock_minimo: StockMinimoAlertaSchema,
  cxp: CxpAlertaSchema,
  cxc: CxcAgingSchema,
  cotizaciones_sin_convertir: CotizacionesSinConvertirSchema,
  pedidos_en_transito: PedidosEnTransitoSchema,
}) satisfies z.ZodType<AlertasResponse>;

// ── Feed ──────────────────────────────────────────────────────────────────

const FeedItemSchema = z.object({
  nro: z.string(),
  cliente: z.string(),
  tipo: z.string(),
  hora: z.string(),
  total: z.coerce.number(),
  items: z.coerce.number(),
});

/**
 * FeedResponseSchema — validates the payload returned by GET /dashboard/feed
 * after ApiService unwraps the `data` envelope.
 */
export const FeedResponseSchema = z.object({
  ventas_hoy: z.array(FeedItemSchema),
}) satisfies z.ZodType<FeedResponse>;

// ── Inferred Types (re-exported for convenience) ──────────────────────────

export type KpisResponseSchema = z.infer<typeof KpisResponseSchema>;
export type AlertasResponseSchema = z.infer<typeof AlertasResponseSchema>;
export type FeedResponseSchema = z.infer<typeof FeedResponseSchema>;
