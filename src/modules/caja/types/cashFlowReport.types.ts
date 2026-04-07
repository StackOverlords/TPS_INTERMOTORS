export interface CashFlowReportConcepto {
    concepto: string;
    concepto_label: string;
    tipo_movimiento: 'INGRESO' | 'EGRESO';
    total: number;
}

export interface CashFlowReportFormaPago {
    forma_pago: string;
    forma_pago_label: string;
    total_ingresos: number;
    total_egresos: number;
    saldo: number;
}

export interface CashFlowReportFlujoDiario {
    fecha: string;
    total_ingresos: number;
    total_egresos: number;
    saldo_neto: number;
}

export interface CashFlowReport {
    sucursal_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    total_ingresos: number;
    total_egresos: number;
    saldo_neto: number;
    por_concepto: CashFlowReportConcepto[];
    por_forma_pago: CashFlowReportFormaPago[];
    flujo_diario: CashFlowReportFlujoDiario[];
}
