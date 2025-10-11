import type { OrdersFilters } from "../types/orderFilters.types";

export const ORDER_QUERY_KEYS = {
    all: ["brands"] as const,
    lists: () => [...ORDER_QUERY_KEYS.all, "list"] as const,
    list: (filters?: OrdersFilters) =>
        [...ORDER_QUERY_KEYS.lists(), { filters }] as const,

    details: () => [...ORDER_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string | number) =>
        [...ORDER_QUERY_KEYS.details(), id] as const,
};  