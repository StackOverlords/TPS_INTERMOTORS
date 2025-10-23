export const TRANSFER_COMMONS_QUERY_KEYS = {
    all: ["transfers", "commons"] as const,
    responsibles: () => [...TRANSFER_COMMONS_QUERY_KEYS.all, "responsibles"] as const,
    branches: (branchId: number) => [...TRANSFER_COMMONS_QUERY_KEYS.all, "branches", branchId] as const,
};
