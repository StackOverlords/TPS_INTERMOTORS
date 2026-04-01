import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';
import type { CreateExpenseTypePayload } from '../types/expenseType.types';

export const useCreateExpenseType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateExpenseTypePayload) => cashService.createExpenseType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.expenseTypes() });
        },
    });
};
