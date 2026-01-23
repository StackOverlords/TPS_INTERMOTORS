import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { StockMinimoFilters } from "../../types/StockMinimoReport.types";
import { productsService } from "../../services/productService";

export const useStockMinimoReport = (filters: StockMinimoFilters, enabled = true) => {
    return useQuery({
        queryKey: ["stock-minimo-report", filters],
        queryFn: async () => {
            console.log("[useStockMinimoReport] Fetching with filters:", filters);
            const result = await productsService.getStockMinimoReport(filters);
            console.log("[useStockMinimoReport] Result:", result);
            return result;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: enabled && !!filters.sucursal,
        retry: 1, // Solo reintentar 1 vez
    });
};
