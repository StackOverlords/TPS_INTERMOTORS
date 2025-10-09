import { useQuery } from "@tanstack/react-query";
import { BRANCH_QUERY_KEYS } from "../../constants/branchQueryKeys";
import { branchesService } from "../../services/branch.service";

export const useGetBranchById = (id: number) => {
    return useQuery({
        queryKey: BRANCH_QUERY_KEYS.detail(id),
        queryFn: () => branchesService.getById(id),
        enabled: !!id && id > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
