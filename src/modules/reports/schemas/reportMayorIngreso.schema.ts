import { z } from 'zod';
import { ReportItemSchema } from './reportGeneral.schema';

// Reutiliza el schema del item (misma estructura)
export const ReportMayorIngresoResponseSchema = z.object({
  data: z.array(ReportItemSchema),
});

// Schema para los filtros (idéntico a mas vendido)
export const ReportMayorIngresoFiltersSchema = z.object({
  fecha_inicio: z.string(),
  fecha_fin: z.string().optional(),
  ranking: z.number().min(1),
  sucursal: z.number().nullable().optional(),
  downloadable: z.boolean().optional(),
});