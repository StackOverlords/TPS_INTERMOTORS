import { toNumberOrZeroStrict } from '@/modules/shared/schemas/numberSchemas';
import { z } from 'zod';

// Schema para un item individual del reporte
export const ReportItemSchema = z.object({
  sucursal: z.string(),
  codigo: z.string(),
  producto: z.string(),
  cantidad: toNumberOrZeroStrict,
  precio_medio: toNumberOrZeroStrict,
  subtotal: toNumberOrZeroStrict,
  subtotal_descuento: toNumberOrZeroStrict,
  total: toNumberOrZeroStrict,
});

// Schema para la respuesta completa del endpoint
export const ReportGeneralResponseSchema = z.object({
  data: z.array(ReportItemSchema),
});

// Schema para los filtros del reporte general
export const ReportGeneralFiltersSchema = z.object({
  fecha_inicio: z.string(),
  fecha_fin: z.string().optional(),
  sucursal: z.number().nullable().optional(),
  downloadable: z.boolean().optional(),
});