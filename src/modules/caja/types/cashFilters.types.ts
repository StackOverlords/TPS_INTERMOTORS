export interface CashSessionFilters {
    /** Sucursal sesionada por el usuario (requerido) */
    sucursal: number;

    /** Estado de la sesión */
    estado?: 'ABIERTA' | 'CERRADA';

    /** Rango inicial fecha de registro (yyyy-mm-dd) */
    fecha_inicio?: string;

    /** Rango final fecha de registro (yyyy-mm-dd) */
    fecha_fin?: string;

    /** Número de página de resultados */
    pagina: number;

    /** Cantidad de registros por página */
    pagina_registros: number;
}

export interface CashMovementFilters {
    /** ID de la sesión de caja */
    caja_sesion_id?: number;

    /** Sucursal */
    sucursal?: number;

    /** Tipo de movimiento */
    tipo_movimiento?: 'INGRESO' | 'EGRESO';

    /** Concepto del movimiento */
    concepto?: string;

    /** Rango inicial fecha de registro (yyyy-mm-dd) */
    fecha_inicio?: string;

    /** Rango final fecha de registro (yyyy-mm-dd) */
    fecha_fin?: string;

    /** Número de página de resultados */
    pagina: number;

    /** Cantidad de registros por página */
    pagina_registros: number;
}
