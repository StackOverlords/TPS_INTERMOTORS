import { z } from 'zod';

// Schema para un item individual del reporte general de cotizaciones
export const QuotationReportGeneralItemSchema = z.object({
    id: z.number().int(),
    fecha: z.string().nullable().optional(),
    nro_cotizacion: z.string().nullable().optional(),
    codigo_quo: z.string().nullable().optional(),
    forma_quo: z.string().nullable().optional(),
    cliente_nombre: z.string().nullable().optional(),
    cliente_nit: z.string().nullable().optional(),
    responsable: z.string().nullable().optional(),
    codigo_producto: z.string().nullable().optional(),
    producto: z.string().nullable().optional(),
    cantidad: z.coerce.number().nullable().optional(),
    precio: z.coerce.number().nullable().optional(),
    descuento: z.coerce.number().nullable().optional(),
    subtotal: z.coerce.number().nullable().optional(),
    convertida: z.boolean().nullable().optional(),
    sucursal_id: z.number().int().nullable().optional(),
});

// Schema para la respuesta completa del endpoint
export const QuotationReportGeneralResponseSchema = z.object({
    data: z.array(QuotationReportGeneralItemSchema),
});

// Schema para los filtros del reporte general de cotizaciones
export const QuotationReportGeneralFiltersSchema = z.object({
    fecha_inicio: z.string(),
    fecha_fin: z.string().optional(),
    sucursal: z.number().nullable().optional(),
    exportar: z.boolean().optional(),
});
