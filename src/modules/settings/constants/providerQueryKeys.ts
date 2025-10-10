import type { ProviderFilters } from "../types/provider.types";

export const PROVIDER_QUERY_KEYS = {
    all: ["providers"] as const,
    lists: () => [...PROVIDER_QUERY_KEYS.all, "list"] as const,
    list: (filters?: ProviderFilters) =>
        [...PROVIDER_QUERY_KEYS.lists(), { filters }] as const,

    details: () => [...PROVIDER_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string | number) =>
        [...PROVIDER_QUERY_KEYS.details(), id] as const,
};
