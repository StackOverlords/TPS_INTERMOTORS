import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';
import type { UpdateExpenseTypePayload } from '../types/expenseType.types';

interface UpdateExpenseTypeParams {
    id: number;
    data: UpdateExpenseTypePayload;
}

export const useUpdateExpenseType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: UpdateExpenseTypeParams) => cashService.updateExpenseType(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.expenseTypes() });
        },
    });
};
