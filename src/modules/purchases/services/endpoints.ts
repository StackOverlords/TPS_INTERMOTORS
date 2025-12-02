const BASE_PATH = '/purchases';

export const PURCHASE_ENDPOINTS = {
    all: BASE_PATH,
    create: BASE_PATH,
    byId: (id: string | number) => `${BASE_PATH}/${id}`,
    update: (id: string | number) => `${BASE_PATH}/${id}`,
    delete: (id: string | number) => `${BASE_PATH}/${id}`,
    providers: "/products/purchases/commons/providers",
    // Nuevos endpoints para commons
    types: "/products/purchases/commons/types",
    modalities: "/products/purchases/commons/modalities",
    responsibles: "/products/purchases/commons/responsibles",
    // Actions
    updatePrices: `${BASE_PATH}/actions/update_prices`,
} as const;
