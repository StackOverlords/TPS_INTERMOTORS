export const PROVIDER_ENDPOINTS = {
    all: "/providers",
    create: "/providers",
    byId: (id: string | number) => `/providers/${id}`,
    update: (id: string | number) => `/providers/${id}`,
    delete: (id: string | number) => `/providers/${id}`,
};
