import type { PurchaseFilters } from "../types/purchaseFilters";

export const PRUCHASE_QUERY_KEYS = {
    all: ["returns"] as const,
    lists: () => [...PRUCHASE_QUERY_KEYS.all, "list"] as const,
    list: (filters?: PurchaseFilters) =>
        [...PRUCHASE_QUERY_KEYS.lists(), { filters }] as const,

    details: () => [...PRUCHASE_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string | number) =>
        [...PRUCHASE_QUERY_KEYS.details(), id] as const,
};  