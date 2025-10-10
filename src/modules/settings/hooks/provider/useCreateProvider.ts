import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProvider } from "../../types/provider.types";
import { providersService } from "../../services/provider.service";
import { PROVIDER_QUERY_KEYS } from "../../constants/providerQueryKeys";

export const useCreateProvider = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProvider) => providersService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROVIDER_QUERY_KEYS.lists() });
        }
    });
};
