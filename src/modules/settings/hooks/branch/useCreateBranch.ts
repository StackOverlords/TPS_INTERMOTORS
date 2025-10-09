import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateBranch } from "../../types/branch.types";
import { branchesService } from "../../services/branch.service";
import { BRANCH_QUERY_KEYS } from "../../constants/branchQueryKeys";

export const useCreateBranch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateBranch) => branchesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.lists() });
        }
    });
};
