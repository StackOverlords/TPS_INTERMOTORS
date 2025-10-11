export const ORDER_COMMONS_KEYS = {
    all: ["orders", "commons"] as const,

    types: () => [...ORDER_COMMONS_KEYS.all, "types"] as const,
    modalities: () => [...ORDER_COMMONS_KEYS.all, "modalities"] as const,
    status: () => [...ORDER_COMMONS_KEYS.all, "status"] as const,
    responsibles: () => [...ORDER_COMMONS_KEYS.all, "responsibles"] as const,
    providers: (proveedor?: string) =>
        [...ORDER_COMMONS_KEYS.all, "providers", proveedor ?? "all"] as const,
};
