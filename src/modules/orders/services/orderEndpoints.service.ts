const BASE_PATH = '/placeorders';

export const ORDER_ENDPOINTS = {
    all: BASE_PATH,
    create: BASE_PATH,
    byId: (pedido: string | number) => `${BASE_PATH}/${pedido}`,
    update: (pedido: string | number) => `${BASE_PATH}/${pedido}`,
    delete: (pedido: string | number) => `${BASE_PATH}/${pedido}`,
    details: {
        delete: (detalle: string | number) => `${BASE_PATH}-detail/${detalle}`,
    },
} as const;