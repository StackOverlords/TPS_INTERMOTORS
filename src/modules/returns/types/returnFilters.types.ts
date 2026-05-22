export interface ReturnsFilters {
    /** Número de página de resultados */
    pagina: number;

    /** Cantidad de registros por página */
    pagina_registros: number;

    /** Sucursal sesionada por el usuario (requerido) */
    sucursal: number;

    /** Palabras clave en comentarios y comprobantes */
    keywords?: string;

    /** Nro de Pedido (codigo_interno) */
    codigo_interno?: number;

    /** ID del responsable de la devolucion */
    responsable?: number;

    /** Rango inicial fecha de registro (yyyy-mm-dd) */
    fecha_inicio?: string;

    /** Rango final fecha de registro (yyyy-mm-dd) */
    fecha_fin?: string;

    /** Código OEM del producto que debería contener en sus detalles */
    codigo_oem_producto?: string;
}
