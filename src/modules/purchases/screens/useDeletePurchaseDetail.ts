import { useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseService } from "../services/purchaseService";

export const useDeletePurchaseDetail = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (idDetail: number) => purchaseService.deleteDetail(idDetail),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
        retry: false,
        networkMode: "offlineFirst",
        gcTime: 1000 * 60 * 3,
    });
};
