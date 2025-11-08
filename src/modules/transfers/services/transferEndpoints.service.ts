export const TRANSFER_ENDPOINTS = {
    all: "/transfers",
    create: "/transfers",
    byId: (id: number) => `/transfers/${id}`,
    update: (id: number) => `/transfers/${id}`,
    delete: (id: number) => `/transfers/${id}`,
    send: (id: number) => `/transfers/actions/${id}/send`,
    accept: (id: number) => `/transfers/actions/${id}/accept`,
};
