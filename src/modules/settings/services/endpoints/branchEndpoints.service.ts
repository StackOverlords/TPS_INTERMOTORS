export const BRANCH_ENDPOINTS = {
    all: "/branches",
    create: "/branches",
    byId: (id: string | number) => `/branches/${id}`,
    update: (id: string | number) => `/branches/${id}`,
    delete: (id: string | number) => `/branches/${id}`,
};
