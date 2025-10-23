import { useQuery } from "@tanstack/react-query";
import { transferCommonsService } from "../../services/commons/transferCommons.service";
import { TRANSFER_COMMONS_QUERY_KEYS } from "../../constants/transferCommonsQueryKeys";

export const useTransferBranches = (branchId: number) => {
    return useQuery({
        queryKey: TRANSFER_COMMONS_QUERY_KEYS.branches(branchId),
        queryFn: () => transferCommonsService.getBranches(branchId),
        enabled: !!branchId,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
};
