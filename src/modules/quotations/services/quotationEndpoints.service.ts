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
} as const;