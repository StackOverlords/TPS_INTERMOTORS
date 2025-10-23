import { useMutation, useQueryClient } from "@tanstack/react-query";
import { branchesService } from "../../services/branch.service";
import { BRANCH_QUERY_KEYS } from "../../constants/branchQueryKeys";

export const useAddUserToBranch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ branchId, data }: { branchId: number; data: { usuario_id: number; rol: string } }) =>
            branchesService.addUserToBranch(branchId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: BRANCH_QUERY_KEYS.branchUsers(variables.branchId),
            });
        },
    });
};
