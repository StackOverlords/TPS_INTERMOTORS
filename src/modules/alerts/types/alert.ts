import { z } from "zod";
import { AlertSchema, AlertCountsSchema } from "../schemas/alert.schema";

/**
 * Alert individual (CxP o CxC)
 *
 * Regla visual:
 * - dias_restantes < 0  → VENCIDA (badge rojo)
 * - dias_restantes >= 0 → PROXIMA (badge amarillo)
 */
export type Alert = z.infer<typeof AlertSchema>;

/**
 * Conteo de alertas no leídas por categoría
 * Usado para el badge en el nav y el dashboard de tesorería
 */
export type AlertCounts = z.infer<typeof AlertCountsSchema>;

/**
 * Filtros para el listado de alertas
 */
export interface AlertFilters {
  sucursal?: number;
  tipo_documento?: "CxP" | "CxC";
  tipo_alerta?: "VENCIDA" | "PROXIMA";
  contraparte?: string;
  pagina?: number;
  pagina_registros?: number;
}
