import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { BranchFilters } from "../../types/branch.types";
import { BRANCH_QUERY_KEYS } from "../../constants/branchQueryKeys";
import { branchesService } from "../../services/branch.service";

export const useGetAllBranches = (filters: BranchFilters) => {

    return useQuery({
        queryKey: BRANCH_QUERY_KEYS.list(filters),
        queryFn: () => branchesService.getAll(filters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 10, // 10 minutes
        enabled: !!filters.pagina && !!filters.pagina_registros
    });
};
