import { formatCell } from "./formatCell";

export const formatCurrency = (
    amount: number | null | undefined,
    {
        currency = "BOB",
        locale = "es-BO",
        fallback = "—",
    }: {
        currency?: string;
        locale?: string;
        fallback?: string;
    } = {}
): string => {
    if (amount == null) return fallback;
    const cleanCurrency = currency.replace(/[^A-Z]/g, '');
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: cleanCurrency,
        minimumFractionDigits: 2,
    }).format(amount);
};

export const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return formatCell(dateString);
    }
};