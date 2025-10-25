import { useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationService } from "../services/quotation.service";

export const useDeleteQuotationDetail = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (idDetail: number) => quotationService.deleteDetail(idDetail),
        onSuccess: () => {
            // Invalida las queries relacionadas con la cotización actual o detalles
            queryClient.invalidateQueries({ queryKey: ["quotations", "details"] });
        },
        retry: false,
        networkMode: "offlineFirst",
        gcTime: 1000 * 60 * 3,
    });
};
