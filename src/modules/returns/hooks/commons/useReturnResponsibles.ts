import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { RETURN_COMMONS_KEYS } from "../../constants/returnCommonsQuerykeys";
import { returnCommonsService } from "../../services/commons/returnCommons.service";

export const useReturnResponsibles = () => {
    return useQuery({
        queryKey: RETURN_COMMONS_KEYS.responsibles(),
        queryFn: async () => await returnCommonsService.getReturnResponsibles(),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 15
    });
};
