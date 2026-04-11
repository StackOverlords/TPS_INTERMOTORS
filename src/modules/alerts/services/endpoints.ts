export const ALERTS_ENDPOINTS = {
    // ─── CxP Alerts ───────────────────────────────────────────────────────────
    cxp: {
        list: '/accounts-payable/alerts',
        markRead: (id: number) => `/accounts-payable/alerts/${id}/read`,
        markAllRead: '/accounts-payable/alerts/read-all',
    },

    // ─── CxC Alerts ───────────────────────────────────────────────────────────
    cxc: {
        list: '/accounts-receivable/alerts',
        markRead: (id: number) => `/accounts-receivable/alerts/${id}/read`,
        markAllRead: '/accounts-receivable/alerts/read-all',
    },
} as const;
