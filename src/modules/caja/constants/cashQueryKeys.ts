import type { CashSessionFilters, CashMovementFilters } from "../types/cashFilters.types";

export const CASH_QUERY_KEYS = {
    all: ['cash'] as const,

    sessions: () => [...CASH_QUERY_KEYS.all, 'sessions'] as const,
    sessionList: (filters?: Partial<CashSessionFilters>) =>
        [...CASH_QUERY_KEYS.sessions(), 'list', { filters }] as const,
    sessionActive: (sucursalId: number) =>
        [...CASH_QUERY_KEYS.sessions(), 'active', sucursalId] as const,
    sessionDetail: (id: number) =>
        [...CASH_QUERY_KEYS.sessions(), 'detail', id] as const,
    sessionArqueo: (id: number) =>
        [...CASH_QUERY_KEYS.sessions(), 'arqueo', id] as const,

    movements: () => [...CASH_QUERY_KEYS.all, 'movements'] as const,
    movementList: (filters?: Partial<CashMovementFilters>) =>
        [...CASH_QUERY_KEYS.movements(), 'list', { filters }] as const,

    expenseTypes: () => [...CASH_QUERY_KEYS.all, 'expense-types'] as const,
    expenseTypeList: (sucursalId: number) =>
        [...CASH_QUERY_KEYS.expenseTypes(), sucursalId] as const,

    reports: () => [...CASH_QUERY_KEYS.all, 'reports'] as const,
    flowReport: (sucursalId: number, fechaInicio: string, fechaFin: string) =>
        [...CASH_QUERY_KEYS.reports(), 'flow', { sucursalId, fechaInicio, fechaFin }] as const,
} as const;
