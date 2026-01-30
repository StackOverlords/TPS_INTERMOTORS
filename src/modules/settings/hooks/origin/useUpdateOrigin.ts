import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateOrigin } from "../../types/origin.types";
import { originsService } from "../../services/origin.service";
import { ORIGIN_QUERY_KEYS } from "../../constants/originQueryKeys";

type UpdateParams = {
    id: number;
    data: UpdateOrigin;
};

export const useUpdateOrigin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: UpdateParams) => originsService.update(id, data),
        onSuccess: (updated, { id }) => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: ORIGIN_QUERY_KEYS.lists() });
            queryClient.setQueryData(ORIGIN_QUERY_KEYS.detail(id), updated);
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "common-origins"],
                refetchType: 'active'
            });
        }
    });
};