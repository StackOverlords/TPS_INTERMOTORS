import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateProvider } from "../../types/provider.types";
import { providersService } from "../../services/provider.service";
import { PROVIDER_QUERY_KEYS } from "../../constants/providerQueryKeys";

export const useUpdateProvider = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateProvider }) =>
            providersService.update(id, data),
        onSuccess: (_data, variables) => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: PROVIDER_QUERY_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: PROVIDER_QUERY_KEYS.detail(variables.id) });
            // Purchases module (select de proveedores en compras)
            queryClient.invalidateQueries({ queryKey: ["purchases", "commons", "providers"] });
            // Orders module (select de proveedores en pedidos)
            queryClient.invalidateQueries({ queryKey: ["orders", "commons", "providers"] });
        }
    });
};
