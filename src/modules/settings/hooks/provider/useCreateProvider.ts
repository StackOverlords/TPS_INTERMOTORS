import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProvider } from "../../types/provider.types";
import { providersService } from "../../services/provider.service";
import { PROVIDER_QUERY_KEYS } from "../../constants/providerQueryKeys";

export const useCreateProvider = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProvider) => providersService.create(data),
        onSuccess: () => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: PROVIDER_QUERY_KEYS.lists() });
            // Purchases module (select de proveedores en compras)
            queryClient.invalidateQueries({ queryKey: ["purchases", "commons", "providers"] });
            // Orders module (select de proveedores en pedidos)
            queryClient.invalidateQueries({ queryKey: ["orders", "commons", "providers"] });
        }
    });
};
