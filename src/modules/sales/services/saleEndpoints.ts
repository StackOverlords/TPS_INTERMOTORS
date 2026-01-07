const BASE_PATH = '/sales';

export const SALE_ENDPOINTS = {
    all: BASE_PATH,
    create: BASE_PATH,
    byId: (venta: string | number) => `${BASE_PATH}/${venta}`,
    update: (venta: string | number) => `${BASE_PATH}/${venta}`,
    delete: (venta: string | number) => `${BASE_PATH}/${venta}`,
    actions: {
        pdf: (venta: string | number) => `${BASE_PATH}/actions/pdf/${venta}`,
    },
    details: {
        delete: (detalle: string | number) => `${BASE_PATH}-detail/${detalle}`,
    },
} as const;
