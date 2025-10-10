import { useQuery } from "@tanstack/react-query";
import { commonLocationService } from "../../services/commonLocation.service";

export const useGetStatesProviders = (countryId: number | undefined) => {
    return useQuery({
        queryKey: ["states", countryId],
        queryFn: () => commonLocationService.getStatesProviders(countryId!),
        enabled: !!countryId && countryId > 0,
        staleTime: 1000 * 60 * 30, // 30 minutos
    });
};

export const useGetStatesCustomers = (countryId: number | undefined) => {
    return useQuery({
        queryKey: ["states", countryId],
        queryFn: () => commonLocationService.getStatesCustomers(countryId!),
        enabled: !!countryId && countryId > 0,
        staleTime: 1000 * 60 * 30, // 30 minutos
    });
};
