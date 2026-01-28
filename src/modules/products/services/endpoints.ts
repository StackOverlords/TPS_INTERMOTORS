const BASE_PATH = "/products";

export const PRODUCT_ENDPOINTS = {
    all: BASE_PATH,
    byId: (producto: string | number) => `${BASE_PATH}/${producto}`,
    update: (producto: string | number) => `${BASE_PATH}/${producto}`,
    delete: (producto: string | number) => `${BASE_PATH}/${producto}`,
    create: `${BASE_PATH}`,
    stockDetails: `${BASE_PATH}/stocks`,
    providerOrders: `${BASE_PATH}/prov-orders`,
    twoYearsSales: `${BASE_PATH}/two-years-sales`,
    getByIdWithStock: (producto: string | number, sucursal: string | number) => `${BASE_PATH}/stocks/${producto}/${sucursal}`,
    actions: {
        updateImage: (producto: string | number) =>
            `${BASE_PATH}/actions/update_image/${producto}`,
    },
    reports: {
        stockMinimo: `${BASE_PATH}/reports/stockminimo`,
        utilidades: `${BASE_PATH}/reports/utilidades`,
        inventarioGeneral: `${BASE_PATH}/reports/general`,
    }
} as const;
