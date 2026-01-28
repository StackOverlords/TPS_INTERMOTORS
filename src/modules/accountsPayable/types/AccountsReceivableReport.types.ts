// Tipos para los Reportes de Cuentas por Cobrar

// ============================================================================
// Filtros para Reporte General
// ============================================================================
export interface AccountsReceivableGeneralFilters {
  fecha_inicio: string; // Fecha de inicio (REQUERIDO)
  fecha_fin: string; // Fecha fin (REQUERIDO)
  sucursal?: number; // Sucursal (opcional)
  downloadable?: boolean; // Para descarga Excel (opcional, usado internamente)
}

// ============================================================================
// Filtros para Reporte de Pagadas
// ============================================================================
export interface AccountsReceivablePaidFilters {
  pago_fecha_ini: string; // Fecha inicio de pagos (REQUERIDO)
  pago_fecha_fin: string; // Fecha fin de pagos (REQUERIDO)
  sucursal?: number; // Sucursal (opcional)
  downloadable?: boolean; // Para descarga Excel (opcional, usado internamente)
}

// ============================================================================
// Filtros para Reporte Por Cliente
// ============================================================================
export interface AccountsReceivableByCustomerFilters {
  fecha_inicio: string; // Fecha de inicio (REQUERIDO)
  fecha_fin: string; // Fecha fin (REQUERIDO)
  cliente: number; // ID del cliente (REQUERIDO)
  sucursal?: number; // Sucursal (opcional)
  downloadable?: boolean; // Para descarga Excel (opcional, usado internamente)
}

// ============================================================================
// Item de Reporte (común para todos los reportes)
// ============================================================================
export interface AccountsReceivableItem {
  nro_venta: string; // Número de venta
  fecha: string; // Fecha de la venta
  cliente: string; // Nombre del cliente
  total: string | number; // Total de la venta
  pagos: string | number; // Pagos realizados
  saldo: string | number; // Saldo pendiente
}

// ============================================================================
// Respuesta de la API (común para todos los reportes)
// ============================================================================
export interface AccountsReceivableReportResponse {
  data: AccountsReceivableItem[];
}

// ============================================================================
// Estadísticas calculadas (frontend)
// ============================================================================
export interface AccountsReceivableStats {
  totalItems: number; // Total de registros
  totalVentas: number; // Suma de totales
  totalPagos: number; // Suma de pagos
  totalSaldo: number; // Suma de saldos pendientes
  porcentajeCobrado: number; // (Pagos / Total) * 100
  cuentasPendientes: number; // Cuentas con saldo > 0
  cuentasPagadas: number; // Cuentas con saldo = 0
}
