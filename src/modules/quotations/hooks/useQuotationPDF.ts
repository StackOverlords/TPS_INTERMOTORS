import { useQuery } from "@tanstack/react-query";
import { quotationService } from "../services/quotation.service";

export const useQuotationPDF = (id: number, enabled = false) => {
    return useQuery({
        queryKey: ["quotation-pdf", id],
        queryFn: () => quotationService.getPDF(id),
        enabled,
        staleTime: 0, // Siempre obtener PDF fresco
        gcTime: 0, // No cachear
    });
};