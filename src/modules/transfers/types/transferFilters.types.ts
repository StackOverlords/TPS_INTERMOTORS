export interface TransfersFilters {
    codigo_interno?: string;
    pagina?: number;
    pagina_registros?: number;
    sucursal?: number;
    keywords?: string;
    responsable?: number;
    fecha_inicio?: Date;
    fecha_fin?: Date;
    sucursal_origen?: number;
    sucursal_destino?: number;
    codigo_oem_producto?: string;
}
