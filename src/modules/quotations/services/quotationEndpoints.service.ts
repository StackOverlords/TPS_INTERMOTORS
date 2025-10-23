const BASE_PATH = '/quotations';

export const QUOTATION_ENDPOINTS = {
    all: "/quotations",
    create: "/quotations",
    byId: (cotizacion: string | number) => `${BASE_PATH}/${cotizacion}`,
    update: (cotizacion: string | number) => `${BASE_PATH}/${cotizacion}`,
    delete: (cotizacion: string | number) => `${BASE_PATH}/${cotizacion}`,
    actions: {
        pdf: (cotizacion: string | number) => `${BASE_PATH}/actions/pdf/${cotizacion}`,
    }
} as const;