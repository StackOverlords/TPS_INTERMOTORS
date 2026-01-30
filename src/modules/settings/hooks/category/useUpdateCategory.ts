import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateCategory } from "../../types/category.types";
import { categoriesService } from "../../services/category.service";
import { CATEGORY_QUERY_KEYS } from "../../constants/categoryQueryKeys";

type UpdateParams = {
    id: number;
    data: UpdateCategory;
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: UpdateParams) => categoriesService.update(id, data),
        onSuccess: (updated, { id }) => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() });
            queryClient.setQueryData(CATEGORY_QUERY_KEYS.detail(id), updated);
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "categories-with-subcategories"],
                refetchType: 'active' // Fuerza refetch de queries activas
            });
            // Legacy categories module
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
    });
};