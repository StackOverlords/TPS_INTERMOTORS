import { useMutation, useQueryClient } from "@tanstack/react-query";
import { branchesService } from "../../services/branch.service";
import { BRANCH_QUERY_KEYS } from "../../constants/branchQueryKeys";

export const useDeleteBranch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => branchesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.lists() });
        }
    });
};
