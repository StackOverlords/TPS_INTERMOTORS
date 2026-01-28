// Tipos para el Reporte General de Inventario

export interface InventarioFilters {
  fecha: string; // Fecha de corte del inventario (REQUERIDO)
  fecha_inicio_costo?: string; // Fecha inicio para cálculo de costos (opcional)
  fecha_fin_costo?: string; // Fecha fin para cálculo de costos (opcional)
  sucursal?: number; // Sucursal (opcional, default: 0)
  incluir_transito?: boolean; // Incluir productos en tránsito (opcional, default: false)
  ver_solo_con_movimiento?: boolean; // Ver solo productos con movimiento (opcional, default: false)
  downloadable?: boolean; // Para descarga Excel (opcional, usado internamente)
}

export interface InventarioItem {
  codigo: string;
  producto: string;
  compras: string | number; // Cantidad total comprada
  ventas: string | number; // Cantidad total vendida
  stock: string | number; // Stock actual (saldo)
  valor: string | number; // Valor monetario del stock
}

export interface InventarioReportResponse {
  data: InventarioItem[];
}

export interface InventarioStats {
  totalItems: number;
  totalCompras: number;
  totalVentas: number;
  totalStock: number;
  totalValor: number;
  rotacion: number; // Ventas / Stock (indicador de rotación)
  productosConStock: number; // Con stock > 0
  productosSinStock: number; // Con stock = 0
}
