export const TRANSFER_REQUEST_ENDPOINTS = {
    base: "/transfer-requests",
    byId: (id: number) => `/transfer-requests/${id}`,
    fulfillDirect: (id: number) => `/transfer-requests/${id}/fulfill-direct`,
    import: (id: number) => `/transfer-requests/${id}/import`,
};
