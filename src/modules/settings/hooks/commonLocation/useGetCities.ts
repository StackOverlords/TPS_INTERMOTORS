import { useQuery } from "@tanstack/react-query";
import { commonLocationService } from "../../services/commonLocation.service";

export const useGetCitiesProviders = (stateId: number | undefined) => {
    return useQuery({
        queryKey: ["cities", stateId],
        queryFn: () => commonLocationService.getCitiesPoviders(stateId!),
        enabled: !!stateId && stateId > 0,
        staleTime: 1000 * 60 * 30, // 30 minutos
    });
};

export const useGetCitiesCustomers = (stateId: number | undefined) => {
    return useQuery({
        queryKey: ["cities", stateId],
        queryFn: () => commonLocationService.getCitiesCustomers(stateId!),
        enabled: !!stateId && stateId > 0,
        staleTime: 1000 * 60 * 30, // 30 minutos
    });
};
