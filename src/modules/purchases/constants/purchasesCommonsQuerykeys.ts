export const PURCHASE_COMMONS_KEYS = {
    all: ["purchases", "commons"] as const,

    types: () => [...PURCHASE_COMMONS_KEYS.all, "types"] as const,
    modalities: () => [...PURCHASE_COMMONS_KEYS.all, "modalities"] as const,
    responsibles: () => [...PURCHASE_COMMONS_KEYS.all, "responsibles"] as const,
    providers: () => [...PURCHASE_COMMONS_KEYS.all, "providers"] as const,
};
