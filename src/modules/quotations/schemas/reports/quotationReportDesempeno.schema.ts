import { z } from 'zod';

// Schema para un item individual del reporte de desempeño
export const QuotationReportDesempenoItemSchema = z.object({
    responsable: z.string().nullable().optional(),
    total_cotizaciones: z.coerce.number().nullable().optional(),
    convertidas: z.coerce.number().nullable().optional(),
    tasa_conversion: z.coerce.number().nullable().optional(),
    monto_promedio_cotizacion: z.coerce.number().nullable().optional(),
});

// Schema para la respuesta completa del endpoint
export const QuotationReportDesempenoResponseSchema = z.object({
    data: z.array(QuotationReportDesempenoItemSchema),
});

// Schema para los filtros del reporte de desempeño
export const QuotationReportDesempenoFiltersSchema = z.object({
    fecha_inicio: z.string(),
    fecha_fin: z.string().optional(),
    sucursal: z.number().nullable().optional(),
});
