import { z } from 'zod';

// Schema para un item individual del reporte de conversión
export const QuotationReportConversionItemSchema = z.object({
    mes: z.string(),
    total_cotizaciones: z.number(),
    cotizaciones_convertidas: z.number(),
    tasa_conversion: z.coerce.number(),
});

// Schema para la respuesta completa del endpoint
export const QuotationReportConversionResponseSchema = z.object({
    data: z.array(QuotationReportConversionItemSchema),
});

// Schema para los filtros del reporte de conversión
export const QuotationReportConversionFiltersSchema = z.object({
    fecha_inicio: z.string(),
    fecha_fin: z.string().optional(),
    sucursal: z.number().nullable().optional(),
});
