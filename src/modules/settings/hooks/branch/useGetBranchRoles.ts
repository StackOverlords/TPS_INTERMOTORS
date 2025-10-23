import { useQuery } from "@tanstack/react-query";
import { BRANCH_QUERY_KEYS } from "../../constants/branchQueryKeys";
import { branchesService } from "../../services/branch.service";

export const useGetBranchRoles = () => {
    return useQuery({
        queryKey: BRANCH_QUERY_KEYS.roles(),
        queryFn: () => branchesService.getBranchRoles(),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};
