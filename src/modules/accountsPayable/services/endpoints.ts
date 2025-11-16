export const ACCOUNT_PAYABLE_ENDPOINTS = {
    all: '/account-receivable',
    paymentTypes: '/accounts-receivable/commons/payment-types',
    termTypes: '/accounts-receivable/commons/term-types',
    // Endpoints de pagos
    payments: (id_venta: number) => `/accounts-receivable/actions/payments/${id_venta}`,
    createPayment: (id_venta: number) => `/accounts-receivable/actions/payments/${id_venta}`,
    deletePayment: (id_pago: number) => `/accounts-receivable/actions/payments/${id_pago}`,
    showPayment: (id_pago: number) => `/accounts-receivable/actions/payments/${id_pago}/show`,
} as const;
