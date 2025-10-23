import { useMutation, useQueryClient } from "@tanstack/react-query";
import { branchesService } from "../../services/branch.service";
import { BRANCH_QUERY_KEYS } from "../../constants/branchQueryKeys";

export const useRemoveUserFromBranch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ branchId, userId }: { branchId: number; userId: number }) =>
            branchesService.removeUserFromBranch(branchId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: BRANCH_QUERY_KEYS.branchUsers(variables.branchId),
            });
        },
    });
};
