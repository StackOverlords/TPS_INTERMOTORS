import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReturnCreate } from "../types/returnCreate.types";
import { returnService } from "../services/return.service";
import { RETURN_QUERY_KEYS } from "../constants/returnQueryKeys";

export const useCreateReturn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ReturnCreate) => returnService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RETURN_QUERY_KEYS.lists() });
        }
    });
};
