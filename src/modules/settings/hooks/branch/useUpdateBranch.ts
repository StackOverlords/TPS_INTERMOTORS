import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateBranch } from "../../types/branch.types";
import { branchesService } from "../../services/branch.service";
import { BRANCH_QUERY_KEYS } from "../../constants/branchQueryKeys";

export const useUpdateBranch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateBranch }) =>
            branchesService.update(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.detail(variables.id) });
        }
    });
};
