import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';

export const useDeleteExpenseType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => cashService.deleteExpenseType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.expenseTypes() });
        },
    });
};
