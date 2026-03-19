import { z } from 'zod';

// Schema para un item individual del reporte de top clientes
export const QuotationReportTopClientesItemSchema = z.object({
    cliente_nombre: z.string().nullable().optional(),
    cliente_nit: z.string().nullable().optional(),
    total_cotizaciones: z.coerce.number().nullable().optional(),
    convertidas: z.coerce.number().nullable().optional(),
    tasa_conversion: z.coerce.number().nullable().optional(),
});

// Schema para la respuesta completa del endpoint
export const QuotationReportTopClientesResponseSchema = z.object({
    data: z.array(QuotationReportTopClientesItemSchema),
});

// Schema para los filtros del reporte de top clientes
export const QuotationReportTopClientesFiltersSchema = z.object({
    fecha_inicio: z.string(),
    fecha_fin: z.string().optional(),
    sucursal: z.number().nullable().optional(),
    top_n: z.number().min(1).optional(),
});
