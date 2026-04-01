import { z } from "zod";
import {
  PurchaseReportGeneralItemSchema,
  PurchaseReportGeneralResponseSchema,
  PurchaseReportGeneralFiltersSchema,
} from "../schemas/purchases/reportPurchaseGeneral.schema";
import {
  PurchaseReportMasCompradoItemSchema,
  PurchaseReportMasCompradoResponseSchema,
  PurchaseReportMasCompradoFiltersSchema,
} from "../schemas/purchases/reportPurchaseMasComprado.schema";
import {
  PurchaseReportMayorCostoItemSchema,
  PurchaseReportMayorCostoResponseSchema,
  PurchaseReportMayorCostoFiltersSchema,
} from "../schemas/purchases/reportPurchaseMayorCosto.schema";

// ─── General ───────────────────────────────────────────────────────────────────
export type PurchaseReportGeneralItem = z.infer<
  typeof PurchaseReportGeneralItemSchema
>;
export type PurchaseReportGeneralResponse = z.infer<
  typeof PurchaseReportGeneralResponseSchema
>;
export type PurchaseReportGeneralFilters = z.infer<
  typeof PurchaseReportGeneralFiltersSchema
>;

// ─── Más Comprado ───────────────────────────────────────────────────────────────
export type PurchaseReportMasCompradoItem = z.infer<
  typeof PurchaseReportMasCompradoItemSchema
>;
export type PurchaseReportMasCompradoResponse = z.infer<
  typeof PurchaseReportMasCompradoResponseSchema
>;
export type PurchaseReportMasCompradoFilters = z.infer<
  typeof PurchaseReportMasCompradoFiltersSchema
>;

// ─── Mayor Costo ────────────────────────────────────────────────────────────────
export type PurchaseReportMayorCostoItem = z.infer<
  typeof PurchaseReportMayorCostoItemSchema
>;
export type PurchaseReportMayorCostoResponse = z.infer<
  typeof PurchaseReportMayorCostoResponseSchema
>;
export type PurchaseReportMayorCostoFilters = z.infer<
  typeof PurchaseReportMayorCostoFiltersSchema
>;
