import { useMutation, useQueryClient } from "@tanstack/react-query";
import { brandsService } from "../../services/brand.service";
import { BRAND_QUERY_KEYS } from "../../constants/brandQueryKeys";

export const useDeleteBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => brandsService.delete(id),
        onSuccess: () => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.lists() });
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "common-brands"],
                refetchType: 'active'
            });
        },
        retry: false,
        networkMode: 'offlineFirst',
        gcTime: 1000 * 60 * 3,
    });
};
