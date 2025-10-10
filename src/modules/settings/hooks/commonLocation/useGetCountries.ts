import { useQuery } from "@tanstack/react-query";
import { commonLocationService } from "../../services/commonLocation.service";

export const useGetCountriesProviders = () => {
    return useQuery({
        queryKey: ["countries"],
        queryFn: () => commonLocationService.getCountriesProviders(),
        staleTime: 1000 * 60 * 60, // 1 hora - los países no cambian frecuentemente
    });
};

export const useGetCountriesCustomers = () => {
    return useQuery({
        queryKey: ["countries"],
        queryFn: () => commonLocationService.getCountriesCustomers(),
        staleTime: 1000 * 60 * 60, // 1 hora - los países no cambian frecuentemente
    });
};
