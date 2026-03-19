import type { z } from 'zod';
import type {
    QuotationReportGeneralItemSchema,
    QuotationReportGeneralResponseSchema,
    QuotationReportGeneralFiltersSchema,
} from '../schemas/reports/quotationReportGeneral.schema';
import type {
    QuotationReportConversionItemSchema,
    QuotationReportConversionResponseSchema,
    QuotationReportConversionFiltersSchema,
} from '../schemas/reports/quotationReportConversion.schema';
import type {
    QuotationReportTopClientesItemSchema,
    QuotationReportTopClientesResponseSchema,
    QuotationReportTopClientesFiltersSchema,
} from '../schemas/reports/quotationReportTopClientes.schema';
import type {
    QuotationReportProductosItemSchema,
    QuotationReportProductosResponseSchema,
    QuotationReportProductosFiltersSchema,
} from '../schemas/reports/quotationReportProductos.schema';
import type {
    QuotationReportAbiertasItemSchema,
    QuotationReportAbiertasResponseSchema,
    QuotationReportAbiertasFiltersSchema,
} from '../schemas/reports/quotationReportAbiertas.schema';
import type {
    QuotationReportDesempenoItemSchema,
    QuotationReportDesempenoResponseSchema,
    QuotationReportDesempenoFiltersSchema,
} from '../schemas/reports/quotationReportDesempeno.schema';

// --- Tipos inferidos del reporte general ---
export type QuotationReportGeneralItem = z.infer<typeof QuotationReportGeneralItemSchema>;
export type QuotationReportGeneralResponse = z.infer<typeof QuotationReportGeneralResponseSchema>;
export type QuotationReportGeneralFilters = z.infer<typeof QuotationReportGeneralFiltersSchema>;

// --- Tipos inferidos del reporte de conversión ---
export type QuotationReportConversionItem = z.infer<typeof QuotationReportConversionItemSchema>;
export type QuotationReportConversionResponse = z.infer<typeof QuotationReportConversionResponseSchema>;
export type QuotationReportConversionFilters = z.infer<typeof QuotationReportConversionFiltersSchema>;

// --- Tipos inferidos del reporte de top clientes ---
export type QuotationReportTopClientesItem = z.infer<typeof QuotationReportTopClientesItemSchema>;
export type QuotationReportTopClientesResponse = z.infer<typeof QuotationReportTopClientesResponseSchema>;
export type QuotationReportTopClientesFilters = z.infer<typeof QuotationReportTopClientesFiltersSchema>;

// --- Tipos inferidos del reporte de productos cotizados ---
export type QuotationReportProductosItem = z.infer<typeof QuotationReportProductosItemSchema>;
export type QuotationReportProductosResponse = z.infer<typeof QuotationReportProductosResponseSchema>;
export type QuotationReportProductosFilters = z.infer<typeof QuotationReportProductosFiltersSchema>;

// --- Tipos inferidos del reporte de cotizaciones abiertas ---
export type QuotationReportAbiertasItem = z.infer<typeof QuotationReportAbiertasItemSchema>;
export type QuotationReportAbiertasResponse = z.infer<typeof QuotationReportAbiertasResponseSchema>;
export type QuotationReportAbiertasFilters = z.infer<typeof QuotationReportAbiertasFiltersSchema>;

// --- Tipos inferidos del reporte de desempeño ---
export type QuotationReportDesempenoItem = z.infer<typeof QuotationReportDesempenoItemSchema>;
export type QuotationReportDesempenoResponse = z.infer<typeof QuotationReportDesempenoResponseSchema>;
export type QuotationReportDesempenoFilters = z.infer<typeof QuotationReportDesempenoFiltersSchema>;
