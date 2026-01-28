// Tipos para el Reporte de Utilidades

export interface UtilidadesFilters {
  sucursal: number;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
}

export interface UtilidadesItem {
  codigo: string;
  producto: string;
  ventas: string | number; // Cantidad vendida
  importe_costo: string | number; // Costo total
  importe_venta: string | number; // Ingreso total
  utilidad: string | number; // Ganancia (venta - costo)
}

export interface UtilidadesReportResponse {
  data: UtilidadesItem[];
}

export interface UtilidadesStats {
  totalItems: number;
  totalVentas: number; // Unidades totales vendidas
  totalCosto: number;
  totalIngreso: number;
  totalUtilidad: number;
  margenPromedio: number; // % promedio de ganancia
  productosRentables: number; // Con utilidad > 0
  productosNoRentables: number; // Con utilidad <= 0
}
