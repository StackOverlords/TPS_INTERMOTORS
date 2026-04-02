import type { CashMovement } from "./cashMovement.types";

export interface ArqueoFormaPago {
    forma_pago: string;
    forma_pago_label: string;
    total_ingresos: number;
    total_egresos: number;
    saldo: number;
}

export interface CashSessionArqueo {
    sesion_id: number;
    estado: 'ABIERTA' | 'CERRADA';
    estado_label: string;
    desglose: ArqueoFormaPago[];
    total_ingresos: number;
    total_egresos: number;
    saldo_sistema: number;
}

export interface BranchRef {
    id: number;
    nombre: string;
}

export interface UserRef {
    id: number;
    nombre: string;
}

export interface CashSession {
    id: number;
    estado: 'ABIERTA' | 'CERRADA';
    estado_label: string;
    sucursal: BranchRef;
    usuario_apertura: UserRef;
    usuario_cierre: UserRef | null;
    fecha_apertura: string;
    fecha_cierre: string | null;
    monto_apertura: number;
    monto_cierre_declarado: number | null;
    monto_cierre_sistema: number | null;
    diferencia: number | null;
    total_ingresos: number;
    total_egresos: number;
    saldo_sistema: number;
    observaciones_apertura: string | null;
    observaciones_cierre: string | null;
    arqueo_por_forma_pago?: ArqueoFormaPago[];
    movimientos?: CashMovement[];
    fecha_reg: string;
}

export interface OpenSessionPayload {
    unidad_organizativa_id: number;
    monto_apertura: number;
    observaciones_apertura?: string;
}

export interface CloseSessionPayload {
    monto_declarado: number;
    observaciones_cierre?: string;
}
