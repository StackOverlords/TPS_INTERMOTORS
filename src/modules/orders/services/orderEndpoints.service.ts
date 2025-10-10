export const ORDER_ENDPOINTS = {
    all: "/placeorders",
    create: "/placeorders",
    byId: (pedido: string | number) => `/placeorders/${pedido}`,
    update: (pedido: string | number) => `/placeorders/${pedido}`,
    delete: (pedido: string | number) => `/placeorders/${pedido}`,
};
