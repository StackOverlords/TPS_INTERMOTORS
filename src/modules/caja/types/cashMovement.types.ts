export type CashMovementConcept =
    // Ingresos
    | 'VENTA_CONTADO'
    | 'VENTA_RAPIDA'
    | 'VENTA_LOCAL'
    | 'VENTA_MULTIPLE'
    | 'COBRANZA_CREDITO'
    | 'ANTICIPO_COTIZACION'
    | 'INGRESO_MANUAL'
    | 'ANULACION_DEVOLUCION'
    // Egresos
    | 'GASTO_NO_DEDUCIBLE'
    | 'RETIRO_EFECTIVO'
    | 'DEVOLUCION_CLIENTE'
    | 'VUELTO'
    | 'ANULACION_VENTA'
    | 'ANULACION_COBRANZA';

export type PaymentType = 'EFECTIVO' | 'TRANSFERENCIA' | 'QR' | 'TARJETA';

export interface CashMovement {
    id: number;
    tipo_movimiento: 'INGRESO' | 'EGRESO';
    concepto: CashMovementConcept;
    concepto_label: string;
    origen: 'AUTOMATICO' | 'MANUAL';
    forma_pago: PaymentType;
    forma_pago_label: string;
    monto: number;
    referencia_tipo: string | null;
    referencia_id: number | null;
    tipo_gasto: { id: number; nombre: string } | null;
    descripcion: string | null;
    fecha_reg: string;
}

export interface IncomePayload {
    unidad_organizativa_id: number;
    monto: number;
    forma_pago: PaymentType;
    descripcion: string;
}

export interface WithdrawalPayload {
    unidad_organizativa_id: number;
    monto: number;
    forma_pago: PaymentType;
    descripcion: string;
}

export interface ExpensePayload {
    unidad_organizativa_id: number;
    caja_gasto_tipo_id: number;
    monto: number;
    forma_pago: PaymentType;
    descripcion?: string;
}
