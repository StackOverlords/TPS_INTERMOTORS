import type { CategoryFilters } from "../types/category.types";

export const CATEGORY_QUERY_KEYS = {
    all: ["categories"] as const,
    lists: () => [...CATEGORY_QUERY_KEYS.all, "list"] as const,
    list: (filters?: CategoryFilters) =>
        [...CATEGORY_QUERY_KEYS.lists(), { filters }] as const,

    details: () => [...CATEGORY_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string | number) =>
        [...CATEGORY_QUERY_KEYS.details(), id] as const,

    syncPreview: (id: string | number, patron: string) =>
        [...CATEGORY_QUERY_KEYS.all, "sync-preview", id, patron] as const,
};  