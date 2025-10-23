import type { TransfersFilters } from "../types/transferFilters.types";

export const TRANSFER_QUERY_KEYS = {
    all: ["transfers"] as const,
    lists: () => [...TRANSFER_QUERY_KEYS.all, "list"] as const,
    list: (filters: Partial<TransfersFilters>) =>
        [...TRANSFER_QUERY_KEYS.lists(), { filters }] as const,
    details: () => [...TRANSFER_QUERY_KEYS.all, "detail"] as const,
    detail: (id: number) => [...TRANSFER_QUERY_KEYS.details(), id] as const,
};
