import { z } from 'zod';

// Schema para un item individual del reporte de cotizaciones abiertas
export const QuotationReportAbiertasItemSchema = z.object({
    id: z.number().int().nullable().optional(),
    nro_cotizacion: z.string().nullable().optional(),
    fecha_quo: z.string().nullable().optional(),
    cliente_nombre: z.string().nullable().optional(),
    cliente_nit: z.string().nullable().optional(),
    cliente_telefono: z.string().nullable().optional(),
    responsable: z.string().nullable().optional(),
    dias_abierta: z.coerce.number().nullable().optional(),
    comentarios: z.string().nullable().optional(),
});

// Schema para la respuesta completa del endpoint
export const QuotationReportAbiertasResponseSchema = z.object({
    data: z.array(QuotationReportAbiertasItemSchema),
});

// Schema para los filtros del reporte de cotizaciones abiertas
export const QuotationReportAbiertasFiltersSchema = z.object({
    fecha_inicio: z.string(),
    fecha_fin: z.string().optional(),
    sucursal: z.number().nullable().optional(),
    dias_minimos: z.number().min(0).optional(),
});
