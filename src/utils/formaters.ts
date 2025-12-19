import { formatCell } from "./formatCell";

export const formatCurrency = (
    amount: number | null | undefined,
    {
      currency = "BOB",
      locale = "es-BO",
      fallback = "—",
      usdFormat = "code",
    }: {
      currency?: string;
      locale?: string;
      fallback?: string;
      usdFormat?: "code" | "symbol" | "us";
    } = {}
  ): string => {
    if (amount == null) return fallback;
  
    const cleanCurrency = currency.replace(/[^A-Z]/g, '');
  
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cleanCurrency,
      minimumFractionDigits: 2,
    });
  
    let formatted = formatter.format(amount);
  
    if (cleanCurrency === "USD") {
      if (usdFormat === "us") {
        formatted = formatted
          .replace("USD", "US$")
          .replace("$", "US$");
      }
  
      if (usdFormat === "symbol") {
        formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }).format(amount);
      }
    }
  
    return formatted;
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