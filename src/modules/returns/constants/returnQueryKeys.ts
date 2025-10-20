import type { ReturnsFilters } from "../types/returnFilters.types";

export const RETURN_QUERY_KEYS = {
    all: ["returns"] as const,
    lists: () => [...RETURN_QUERY_KEYS.all, "list"] as const,
    list: (filters?: ReturnsFilters) =>
        [...RETURN_QUERY_KEYS.lists(), { filters }] as const,

    details: () => [...RETURN_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string | number) =>
        [...RETURN_QUERY_KEYS.details(), id] as const,
};  