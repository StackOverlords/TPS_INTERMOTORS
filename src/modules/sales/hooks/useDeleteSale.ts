import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salesService } from "../services/salesService";

export const useDeleteSale = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (idSale: number) => salesService.delete(idSale),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales", "products", "product-detail", "product-detail-with-stock", "product-sales-stats"] });
        },
        retry: false,
        networkMode: 'offlineFirst',
        gcTime: 1000 * 60 * 3,
    });
};
