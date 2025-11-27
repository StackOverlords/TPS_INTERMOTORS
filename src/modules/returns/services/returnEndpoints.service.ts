const BASE_PATH = '/returns';

export const RETURN_ENDPOINTS = {
    all: BASE_PATH,
    create: BASE_PATH,
    byId: (devolucion: string | number) => `${BASE_PATH}/${devolucion}`,
    update: (devolucion: string | number) => `${BASE_PATH}/${devolucion}`,
    delete: (devolucion: string | number) => `${BASE_PATH}/${devolucion}`,
    details: {
        delete: (detalle: string | number) => `${BASE_PATH}-detail/${detalle}`,
    },
} as const;