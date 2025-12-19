import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { productsService } from "../../services/productService";

export const useProductByIdWithStock = (productId: number, sucursalId: number) => {
    return useQuery({
        queryKey: ["product-detail-with-stock", productId],
        queryFn: async () => await productsService.getByIdWithStock(productId, sucursalId),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!productId && !!sucursalId
    });
};
