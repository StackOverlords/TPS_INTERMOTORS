export interface PurchaseFilters {
    pagina?: number;
    pagina_registros?: number;
    sucursal: number;
    keywords?: string;
    codigo_interno?: number;
    proveedor?: number;
    fecha_inicio?: Date;
    fecha_fin?: Date;
    codigo_oem_producto?: string;
}
