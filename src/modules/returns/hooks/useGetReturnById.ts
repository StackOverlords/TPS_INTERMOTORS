import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { RETURN_QUERY_KEYS } from "../constants/returnQueryKeys";
import { returnService } from "../services/return.service";

export const useGetReturnById = (id: number) => {
    return useQuery({
        queryKey: RETURN_QUERY_KEYS.detail(id),
        queryFn: () => returnService.getById(id),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!id
    });
};
