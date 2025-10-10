export const CUSTOMER_ENDPOINTS = {
    all: '/customers',
    create: '/customers',
    byId: (id: number) => `/customers/${id}`,
    update: (id: number) => `/customers/${id}`,
    delete: (id: number) => `/customers/${id}`,
} as const;
