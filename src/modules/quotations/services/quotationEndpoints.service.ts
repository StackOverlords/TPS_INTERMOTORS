const BASE_PATH = '/quotations';

export const QUOTATION_ENDPOINTS = {
    all: BASE_PATH,
    create: BASE_PATH,
    byId: (cotizacion: string | number) => `${BASE_PATH}/${cotizacion}`,
    update: (cotizacion: string | number) => `${BASE_PATH}/${cotizacion}`,
    delete: (cotizacion: string | number) => `${BASE_PATH}/${cotizacion}`,
    actions: {
        pdf: (cotizacion: string | number) => `${BASE_PATH}/actions/pdf/${cotizacion}`,
    },
    details: {
        delete: (detalle: string | number) => `${BASE_PATH}-detail/${detalle}`,
    },
    reports: {
        general: `${BASE_PATH}/reports/general`,
        conversion: `${BASE_PATH}/reports/conversion`,
        topClientes: `${BASE_PATH}/reports/top-clientes`,
        productosCotizados: `${BASE_PATH}/reports/productos-cotizados`,
        abiertas: `${BASE_PATH}/reports/abiertas`,
        desempeno: `${BASE_PATH}/reports/desempeno`,
    },
} as const;