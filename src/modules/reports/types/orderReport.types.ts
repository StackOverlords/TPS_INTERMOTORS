import { z } from "zod";
import type {
  OrderReportGeneralFiltersSchema,
  OrderReportGeneralItemSchema,
  OrderReportGeneralResponseSchema,
} from "../schemas/orders/generalOrderReport.schema";
import type {
  OrderReportTopProveedoresFiltersSchema,
  OrderReportTopProveedoresItemSchema,
  OrderReportTopProveedoresResponseSchema,
} from "../schemas/orders/reportTopProviders.schema";
import type {
  OrderReportTiempoMedioFiltersSchema,
  OrderReportTiempoMedioItemSchema,
  OrderReportTiempoMedioResponseSchema,
} from "../schemas/orders/reportTiempoMedio.schema";

// ── Reporte General ───────────────────────────────────────────────────────────
export type OrderReportGeneralItem = z.infer<
  typeof OrderReportGeneralItemSchema
>;
export type OrderReportGeneralResponse = z.infer<
  typeof OrderReportGeneralResponseSchema
>;
export type OrderReportGeneralFilters = z.infer<
  typeof OrderReportGeneralFiltersSchema
>;

// ── Top Proveedores ───────────────────────────────────────────────────────────
export type OrderReportTopProveedoresItem = z.infer<
  typeof OrderReportTopProveedoresItemSchema
>;
export type OrderReportTopProveedoresResponse = z.infer<
  typeof OrderReportTopProveedoresResponseSchema
>;
export type OrderReportTopProveedoresFilters = z.infer<
  typeof OrderReportTopProveedoresFiltersSchema
>;

// ── Tiempo Medio ──────────────────────────────────────────────────────────────
export type OrderReportTiempoMedioItem = z.infer<
  typeof OrderReportTiempoMedioItemSchema
>;
export type OrderReportTiempoMedioResponse = z.infer<
  typeof OrderReportTiempoMedioResponseSchema
>;
export type OrderReportTiempoMedioFilters = z.infer<
  typeof OrderReportTiempoMedioFiltersSchema
>;
