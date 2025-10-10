import { useQuery } from "@tanstack/react-query";
import { PROVIDER_QUERY_KEYS } from "../../constants/providerQueryKeys";
import { providersService } from "../../services/provider.service";

export const useGetProviderById = (id: number) => {
    return useQuery({
        queryKey: PROVIDER_QUERY_KEYS.detail(id),
        queryFn: () => providersService.getById(id),
        enabled: !!id && id > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
