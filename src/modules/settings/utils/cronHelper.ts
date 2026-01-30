/**
 * Opciones de frecuencia predefinidas
 */
export const FREQUENCY_OPTIONS = {
    hourly: { label: "Cada hora", cron: "0 * * * *" },
    daily: { label: "Diario", cron: "0 4 * * *" },
    weekly: { label: "Semanal", cron: "0 4 * * 0" },
    monthly: { label: "Mensual", cron: "0 4 1 * *" },
} as const;

export const HOUR_OPTIONS = [
    { value: "01:00", cron: "0 1 * * *" },
    { value: "02:00", cron: "0 2 * * *" },
    { value: "03:00", cron: "0 3 * * *" },
    { value: "04:00", cron: "0 4 * * *" },
    { value: "05:00", cron: "0 5 * * *" },
] as const;

export const RETENTION_OPTIONS = [
    { value: 7, label: "7 días" },
    { value: 30, label: "30 días" },
    { value: 90, label: "90 días" },
    { value: 365, label: "1 año" },
] as const;

/**
 * Determina la frecuencia basada en la expresión cron
 */
export const getFrequencyFromCron = (cron: string): keyof typeof FREQUENCY_OPTIONS | "custom" => {
    for (const [key, option] of Object.entries(FREQUENCY_OPTIONS)) {
        if (option.cron === cron) {
            return key as keyof typeof FREQUENCY_OPTIONS;
        }
    }
    return "custom";
};

/**
 * Extrae la hora de una expresión cron (formato HH:MM)
 */
export const getHourFromCron = (cron: string): string => {
    const parts = cron.split(" ");
    if (parts.length >= 2) {
        const minute = parts[0].padStart(2, "0");
        const hour = parts[1].padStart(2, "0");
        return `${hour}:${minute}`;
    }
    return "04:00";
};

/**
 * Crea una expresión cron personalizada con la hora especificada
 * manteniendo el patrón de frecuencia
 */
export const updateCronHour = (baseCron: string, hour: string): string => {
    const [hourPart, minutePart] = hour.split(":");
    const parts = baseCron.split(" ");
    parts[0] = minutePart || "0";
    parts[1] = hourPart || "4";
    return parts.join(" ");
};
