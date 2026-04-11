import { z } from "zod";

// ─────────────────────────────────────────────
// Bucket de proyección (CxP o CxC, 4 horizontes)
// ─────────────────────────────────────────────

const TreasuryProjectionBucketSchema = z.object({
  /** Total en bolivianos del bucket */
  total: z.coerce.number(),
  /** Cantidad de documentos en el bucket */
  cantidad: z.number().optional(),
});

const TreasuryProjectionSchema = z.object({
  vencida: TreasuryProjectionBucketSchema,
  proximos_7_dias: TreasuryProjectionBucketSchema,
  proximos_15_dias: TreasuryProjectionBucketSchema,
  proximos_30_dias: TreasuryProjectionBucketSchema,
});

// ─────────────────────────────────────────────
// Contadores de alertas en el dashboard
// ─────────────────────────────────────────────

const TreasuryAlertCountersSchema = z.object({
  cxc_pendientes: z.number(),
  cxc_vencidas: z.number(),
  cxp_pendientes: z.number(),
  cxp_vencidas: z.number(),
});

// ─────────────────────────────────────────────
// Dashboard de Tesorería
// GET /api/v1/treasury/dashboard?sucursal=X
// ─────────────────────────────────────────────

export const TreasuryDashboardSchema = z.object({
  sucursal_id: z.number(),
  fecha: z.string(),
  /** Efectivo en caja/banco */
  posicion_caja_ef: z.coerce.number(),
  /** Total CxC pendiente de cobro */
  cxc_total_pendiente: z.coerce.number(),
  /** Total CxP pendiente de pago */
  cxp_total_pendiente: z.coerce.number(),
  /**
   * Posición neta = posicion_caja_ef + cxc_total_pendiente - cxp_total_pendiente
   * Si < 0 → mostrar en rojo
   */
  posicion_neta: z.coerce.number(),
  alertas: TreasuryAlertCountersSchema,
  proyeccion_cxp: TreasuryProjectionSchema,
  proyeccion_cxc: TreasuryProjectionSchema,
});

export type TreasuryDashboard = z.infer<typeof TreasuryDashboardSchema>;
export type TreasuryProjection = z.infer<typeof TreasuryProjectionSchema>;
export type TreasuryAlertCounters = z.infer<typeof TreasuryAlertCountersSchema>;
