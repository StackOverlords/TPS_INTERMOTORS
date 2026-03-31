import { useQuery } from '@tanstack/react-query';
import { useBranchStore } from '@/states/branchStore';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';

export const useExpenseTypes = () => {
    const sucursalId = Number(useBranchStore((s) => s.selectedBranchId));

    return useQuery({
        queryKey: CASH_QUERY_KEYS.expenseTypeList(sucursalId),
        queryFn: () => cashService.getExpenseTypes(sucursalId),
        staleTime: 1000 * 60 * 5,
        enabled: !!sucursalId,
    });
};
