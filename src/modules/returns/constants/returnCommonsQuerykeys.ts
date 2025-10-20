export const RETURN_COMMONS_KEYS = {
    all: ["returns", "commons"] as const,

    types: () => [...RETURN_COMMONS_KEYS.all, "types"] as const,
    responsibles: () => [...RETURN_COMMONS_KEYS.all, "responsibles"] as const,
};
