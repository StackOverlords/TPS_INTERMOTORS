import { useQuery } from "@tanstack/react-query";
import { BRANCH_QUERY_KEYS } from "../../constants/branchQueryKeys";
import { branchesService } from "../../services/branch.service";

export const useGetBranchUsers = (branchId: number) => {
    return useQuery({
        queryKey: BRANCH_QUERY_KEYS.branchUsers(branchId),
        queryFn: () => branchesService.getBranchUsers(branchId),
        enabled: !!branchId,
    });
};
