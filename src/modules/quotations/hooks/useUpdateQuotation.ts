import { useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationService } from "../services/quotation.service";
import type { QuotationUpdate } from "../types/quotationUpdate.types";

type UpdateQuotationParams = {
    quotationId: number;
    data: QuotationUpdate;
};

export const useUpdateQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ quotationId, data }: UpdateQuotationParams) => quotationService.update(quotationId, data),
        onSuccess: (updatedQuotation, { quotationId }) => {
            queryClient.invalidateQueries({ queryKey: ["quotations"] });
            queryClient.invalidateQueries({ queryKey: ["details", quotationId] });
            queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
            queryClient.invalidateQueries({ queryKey: ["cash-session-active"] });
            queryClient.setQueryData(["quotation-detail", quotationId], updatedQuotation);
        }
    });
};
