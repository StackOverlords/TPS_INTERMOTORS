import type { z } from 'zod';
import type {
  ReportItemSchema,
  ReportGeneralResponseSchema,
  ReportGeneralFiltersSchema,
} from '../schemas/sales/reportGeneral.schema';
import type {
  ReportMasVendidoResponseSchema,
  ReportMasVendidoFiltersSchema,
} from '../schemas/sales/reportMasVendido.schema';
import type {
  ReportMayorIngresoResponseSchema,
  ReportMayorIngresoFiltersSchema,
} from '../schemas/sales/reportMayorIngreso.schema';

export type ReportItem = z.infer<typeof ReportItemSchema>;

export type ReportGeneralResponse = z.infer<typeof ReportGeneralResponseSchema>;
export type ReportGeneralFilters = z.infer<typeof ReportGeneralFiltersSchema>;

export type ReportMasVendidoResponse = z.infer<typeof ReportMasVendidoResponseSchema>;
export type ReportMasVendidoFilters = z.infer<typeof ReportMasVendidoFiltersSchema>;

export type ReportMayorIngresoResponse = z.infer<typeof ReportMayorIngresoResponseSchema>;
export type ReportMayorIngresoFilters = z.infer<typeof ReportMayorIngresoFiltersSchema>;

// Configuración de vista (solo frontend)
export type ViewMode = 'chart' | 'table';

// Configuración de ordenamiento (solo frontend)
export interface SortConfig {
  field: keyof ReportItem;
  direction: 'asc' | 'desc';
}

// Tipo de reporte (para navegación)
export type ReportType = 'general' | 'masvendido' | 'mayoringreso';

// Filtros comunes para UI
export interface ReportUIFilters {
  fecha_inicio: string;
  fecha_fin: string;
  sucursal: number | null;
  compareWithPrevious?: boolean; // Solo frontend
}

// Filtros específicos de ranking para UI
export interface ReportRankingUIFilters extends ReportUIFilters {
  ranking: number;
}