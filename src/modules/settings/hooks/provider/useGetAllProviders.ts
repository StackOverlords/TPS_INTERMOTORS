import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ProviderFilters } from "../../types/provider.types";
import { PROVIDER_QUERY_KEYS } from "../../constants/providerQueryKeys";
import { providersService } from "../../services/provider.service";

export const useGetAllProviders = (filters: ProviderFilters) => {

    return useQuery({
        queryKey: PROVIDER_QUERY_KEYS.list(filters),
        queryFn: () => providersService.getAll(filters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 10, // 10 minutes
        enabled: !!filters.pagina && !!filters.pagina_registros
    });
};
