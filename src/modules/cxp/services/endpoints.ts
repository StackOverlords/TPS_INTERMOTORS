export const CXP_ENDPOINTS = {
    // Lista principal de cuentas por pagar
    all: '/account-payable',

    // Pagos de una compra
    payments: (id_compra: number) => `/accounts-payable/actions/payments/${id_compra}`,
    createPayment: (id_compra: number) => `/accounts-payable/actions/payments/${id_compra}`,
    showPayment: (id_pago: number) => `/accounts-payable/actions/payments/${id_pago}/show`,
    deletePayment: (id_pago: number) => `/accounts-payable/actions/payments/${id_pago}`,

    // Notas de crédito de una compra
    createCreditNote: (id_compra: number) => `/accounts-payable/actions/credit-notes/${id_compra}`,

    // Datos de formularios
    paymentTypes: '/accounts-payable/commons/payment-types',
    termTypes: '/accounts-payable/commons/term-types',

    // Reportes CxP
    reports: {
        general: '/accounts-payable/reports/general',
        bySupplier: '/accounts-payable/reports/by-supplier',
        projection: '/accounts-payable/reports/projection',
        supplierRanking: '/accounts-payable/reports/supplier-ranking',
    },
} as const;
