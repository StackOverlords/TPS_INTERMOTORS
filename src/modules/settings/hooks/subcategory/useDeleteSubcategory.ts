import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subcategoriesService } from "../../services/subcategory.service";
import { SUBCATEGORY_QUERY_KEYS } from "../../constants/subcategoryQueryKeys";

export const useDeleteSubcategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => subcategoriesService.delete(id),
        onSuccess: () => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: SUBCATEGORY_QUERY_KEYS.lists() });
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "common-subcategories"],
                refetchType: 'active'
            });
            queryClient.invalidateQueries({
                queryKey: ["shared", "categories-with-subcategories"],
                refetchType: 'active'
            });
        },
        retry: false,
        networkMode: 'offlineFirst',
        gcTime: 1000 * 60 * 3,
    });
};