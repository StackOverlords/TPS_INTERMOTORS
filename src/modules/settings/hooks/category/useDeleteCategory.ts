import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesService } from "../../services/category.service";
import { CATEGORY_QUERY_KEYS } from "../../constants/categoryQueryKeys";

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => categoriesService.delete(id),
        onSuccess: () => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() });
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "categories-with-subcategories"],
                refetchType: 'active' // Fuerza refetch de queries activas
            });
            // Legacy categories module
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        retry: false,
        networkMode: 'offlineFirst',
        gcTime: 1000 * 60 * 3,
    });
};