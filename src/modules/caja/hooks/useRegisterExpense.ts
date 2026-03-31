import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';
import type { ExpensePayload } from '../types/cashMovement.types';

interface RegisterExpenseParams {
    sessionId: number;
    data: ExpensePayload;
}

export const useRegisterExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data }: RegisterExpenseParams) => cashService.registerExpense(data),
        onSuccess: (_result, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessionDetail(sessionId) });
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.movements() });
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessions() });
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.expenseTypes() });
        },
    });
};
