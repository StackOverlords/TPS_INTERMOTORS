export const RETURN_ENDPOINTS = {
    all: "/returns",
    create: "/returns",
    byId: (devolucion: string | number) => `/returns/${devolucion}`,
    update: (devolucion: string | number) => `/returns/${devolucion}`,
    delete: (devolucion: string | number) => `/returns/${devolucion}`,
};
