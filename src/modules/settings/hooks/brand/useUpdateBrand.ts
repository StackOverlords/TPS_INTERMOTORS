import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateBrand } from "../../types/brand.types";
import { brandsService } from "../../services/brand.service";
import { BRAND_QUERY_KEYS } from "../../constants/brandQueryKeys";

type UpdateParams = {
    id: number;
    data: UpdateBrand;
};

export const useUpdateBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: UpdateParams) => brandsService.update(id, data),
        onSuccess: (updated, { id }) => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEYS.lists() });
            queryClient.setQueryData(BRAND_QUERY_KEYS.detail(id), updated);
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "common-brands"],
                refetchType: 'active'
            });
        }
    });
};