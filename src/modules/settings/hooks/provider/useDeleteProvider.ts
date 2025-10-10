import { useMutation, useQueryClient } from "@tanstack/react-query";
import { providersService } from "../../services/provider.service";
import { PROVIDER_QUERY_KEYS } from "../../constants/providerQueryKeys";

export const useDeleteProvider = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => providersService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROVIDER_QUERY_KEYS.lists() });
        }
    });
};
