// Tipos para el reporte de stock mínimo

export interface StockMinimoFilters {
  sucursal: number;
  ver_solo_con_saldo_menorigual_al_minimo?: boolean;
  ver_solo_con_saldo_cercano_al_minimo_segun_parametro?: boolean;
  parametro?: number;
  downloadable?: boolean;
}

export interface StockMinimoItem {
  codigo: string;
  producto: string;
  stock_actual: string;
  stock_minimo: string;
  diferencia: number;
}

export interface StockMinimoReportResponse {
  data: StockMinimoItem[];
}
