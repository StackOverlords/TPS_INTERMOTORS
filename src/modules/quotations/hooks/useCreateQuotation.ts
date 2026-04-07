import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QuotationCreate } from "../types/quotationCreate.types";
import { quotationService } from "../services/quotation.service";

export const useCreateQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: QuotationCreate) => quotationService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotations"] });
            queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
            queryClient.invalidateQueries({ queryKey: ["cash-session-active"] });
        }
    });
};
