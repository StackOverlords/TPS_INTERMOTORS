export const PURCHASE_ENDPOINTS = {
    all: "/purchases",
    byId: (id: number) => `/purchases/${id}`,
    update: (id: number) => `/purchases/${id}`,
    delete: (id: number) => `/purchases/${id}`,
    providers: "/products/purchases/commons/providers",
    // Nuevos endpoints para commons
    types: "/products/purchases/commons/types",
    modalities: "/products/purchases/commons/modalities",
    responsibles: "/products/purchases/commons/responsibles",
} as const;
