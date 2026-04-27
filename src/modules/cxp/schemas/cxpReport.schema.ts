import { z } from "zod";

// ─────────────────────────────────────────────
// Shared: Proveedor embebido en items CxP
// ─────────────────────────────────────────────

const ProveedorSchema = z.object({
  id: z.number(),
  proveedor: z.string(),
});

// ─────────────────────────────────────────────
// CxP List Item — shape del AccountPayableFetchResource
// { id, nro_compra, fecha, plazo_pago, proveedor, total_comprado, total_pagado, saldo }
// ─────────────────────────────────────────────

export const CxPListItemSchema = z.object({
  id: z.number(),
  nro_compra: z.union([z.string(), z.number()]).transform((val) => String(val)),
  fecha: z.string(),
  plazo_pago: z.string().nullable(),
  proveedor: ProveedorSchema,
  total_comprado: z.coerce.number(),
  total_pagado: z.coerce.number(),
  saldo: z.coerce.number(),
});

export type CxPListItem = z.infer<typeof CxPListItemSchema>;

// ─────────────────────────────────────────────
// CxP Report Item — shape del raw SQL de reportes
// Distinto al CxPListItemSchema (que viene del Resource del listado)
// { almacen_in_id, nro, prefijo, fecha, plazo_pago, obs, proveedor (string plana), total, pagos, saldo }
// ─────────────────────────────────────────────

export const CxPReportItemSchema = z.object({
  almacen_in_id: z.number(),
  nro: z.union([z.string(), z.number()]).transform((val) => String(val)),
  prefijo: z.string().nullable(),
  fecha: z.string(),
  plazo_pago: z.string().nullable(),
  obs: z.string().nullable(),
  proveedor: z.string(),
  total: z.coerce.number(),
  pagos: z.coerce.number(),
  saldo: z.coerce.number(),
});

export type CxPReportItem = z.infer<typeof CxPReportItemSchema>;

// ─────────────────────────────────────────────
// Reporte General CxP
// POST /api/v1/accounts-payable/reports/general
// ─────────────────────────────────────────────

export const CxPGeneralReportFilterSchema = z.object({
  sucursal: z.number().int(),
  fecha_inicio: z.string().min(1, "La fecha de inicio es requerida"),
  fecha_fin: z.string().min(1, "La fecha de fin es requerida"),
  proveedor: z.number().int().optional(),
  fecha_plazo_inicio: z.string().optional(),
  fecha_plazo_fin: z.string().optional(),
});

export const CxPGeneralReportResponseSchema = z.array(CxPReportItemSchema);

export type CxPGeneralReportFilter = z.infer<typeof CxPGeneralReportFilterSchema>;
export type CxPGeneralReportResponse = z.infer<typeof CxPGeneralReportResponseSchema>;

// ─────────────────────────────────────────────
// Reporte Por Proveedor CxP
// POST /api/v1/accounts-payable/reports/by-supplier
// proveedor es requerido — el DTO del backend no maneja null en IntegerCast
// ─────────────────────────────────────────────

export const CxPBySupplierReportFilterSchema = z.object({
  sucursal: z.number().int(),
  proveedor: z.number().int().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
});

export const CxPBySupplierReportResponseSchema = z.array(CxPReportItemSchema);

export type CxPBySupplierReportFilter = z.infer<typeof CxPBySupplierReportFilterSchema>;
export type CxPBySupplierReportResponse = z.infer<typeof CxPBySupplierReportResponseSchema>;

// ─────────────────────────────────────────────
// Reporte Proyección CxP
// GET /api/v1/accounts-payable/reports/projection?sucursal=X
// ─────────────────────────────────────────────

const CxPProjectionBucketSchema = z.object({
  total: z.coerce.number(),
  detalle: z.array(CxPListItemSchema),
});

export const CxPProjectionReportResponseSchema = z.object({
  vencidas: CxPProjectionBucketSchema,
  proximos_7_dias: CxPProjectionBucketSchema,
  proximos_15_dias: CxPProjectionBucketSchema,
  proximos_30_dias: CxPProjectionBucketSchema,
});

export type CxPProjectionBucket = z.infer<typeof CxPProjectionBucketSchema>;
export type CxPProjectionReportResponse = z.infer<typeof CxPProjectionReportResponseSchema>;

// ─────────────────────────────────────────────
// Reporte Ranking de Proveedores CxP
// POST /api/v1/accounts-payable/reports/supplier-ranking
// Shape: array agregado por proveedor (una fila por proveedor)
// ─────────────────────────────────────────────

export const CxPRankingItemSchema = z.object({
  proveedor_id: z.number().int(),
  proveedor: z.string(),
  nit: z.string().nullable(),
  total_compras: z.coerce.number(),
  volumen_compra: z.coerce.number(),
  total_pagado: z.coerce.number(),
  deuda_pendiente: z.coerce.number(),
});

export const CxPRankingReportFilterSchema = z.object({
  sucursal: z.number().int(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
});

export const CxPRankingReportResponseSchema = z.array(CxPRankingItemSchema);

export type CxPRankingItem = z.infer<typeof CxPRankingItemSchema>;
export type CxPRankingReportFilter = z.infer<typeof CxPRankingReportFilterSchema>;
export type CxPRankingReportResponse = z.infer<typeof CxPRankingReportResponseSchema>;
