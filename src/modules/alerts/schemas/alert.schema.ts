import { z } from "zod";

// ─────────────────────────────────────────────
// Contraparte embebida (cliente o proveedor)
// ─────────────────────────────────────────────

const ContraparteSchema = z.object({
  id: z.number(),
  nombre: z.string(),
});

// ─────────────────────────────────────────────
// Documento embebido (venta o compra)
// ─────────────────────────────────────────────

const DocumentoSchema = z.object({
  id: z.number(),
  nro: z.union([z.string(), z.number()]).transform((val) => String(val)),
  fecha: z.string(),
});

// ─────────────────────────────────────────────
// Alert — item individual
// ─────────────────────────────────────────────

export const AlertSchema = z.object({
  id: z.number(),
  tipo_documento: z.enum(["CxP", "CxC"]),
  tipo_alerta: z.enum(["VENCIDA", "PROXIMA"]),
  tipo_alerta_label: z.string(),
  estado: z.string(),
  /** Días restantes hasta vencimiento. Negativo = VENCIDA */
  dias_restantes: z.number(),
  plazo_pago: z.string().nullable(),
  saldo_pendiente: z.coerce.number(),
  contraparte: ContraparteSchema,
  documento: DocumentoSchema,
});

/**
 * Schema para la respuesta de lista de alertas (paginada)
 */
export const AlertListResponseSchema = z.object({
  data: z.array(AlertSchema),
  total: z.number().optional(),
  pagina: z.number().optional(),
  pagina_registros: z.number().optional(),
});

/**
 * Schema para el conteo de alertas no leídas
 * Usado con refetchInterval: 60_000 para el badge de navegación
 */
export const AlertCountsSchema = z.object({
  cxp_pendientes: z.number(),
  cxp_vencidas: z.number(),
  cxc_pendientes: z.number(),
  cxc_vencidas: z.number(),
  /** Total unread = cxp_pendientes + cxp_vencidas + cxc_pendientes + cxc_vencidas */
  total_no_leidas: z.number(),
});

export type Alert = z.infer<typeof AlertSchema>;
export type AlertListResponse = z.infer<typeof AlertListResponseSchema>;
export type AlertCounts = z.infer<typeof AlertCountsSchema>;
