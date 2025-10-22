import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { RETURN_COMMONS_KEYS } from "../../constants/returnCommonsQuerykeys";
import { returnCommonsService } from "../../services/commons/returnCommons.service";

export const useReturnTypes = () => {
    return useQuery({
        queryKey: RETURN_COMMONS_KEYS.types(),
        queryFn: async () => await returnCommonsService.getReturnTypes(),
        placeholderData: keepPreviousData,
        staleTime: Infinity
    });
};
