import { z } from 'zod';

// Schema para un item individual del reporte de productos cotizados
export const QuotationReportProductosItemSchema = z.object({
    codigo: z.string().nullable().optional(),
    producto: z.string().nullable().optional(),
    veces_cotizado: z.coerce.number().nullable().optional(),
    cantidad_cotizada: z.coerce.number().nullable().optional(),
    precio_promedio: z.coerce.number().nullable().optional(),
    monto_total: z.coerce.number().nullable().optional(),
});

// Schema para la respuesta completa del endpoint
export const QuotationReportProductosResponseSchema = z.object({
    data: z.array(QuotationReportProductosItemSchema),
});

// Schema para los filtros del reporte de productos cotizados
export const QuotationReportProductosFiltersSchema = z.object({
    fecha_inicio: z.string(),
    fecha_fin: z.string().optional(),
    sucursal: z.number().nullable().optional(),
    top_n: z.number().min(1).optional(),
});
