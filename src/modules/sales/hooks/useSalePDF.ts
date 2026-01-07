import { useQuery } from "@tanstack/react-query";
import { salesService } from "../services/salesService";

export const useSalePDF = (id: number, enabled = false) => {
    return useQuery({
        queryKey: ["sale-pdf", id],
        queryFn: () => salesService.getPDF(id),
        enabled,
        staleTime: 0, // Siempre obtener PDF fresco
        gcTime: 0, // No cachear
    });
};
