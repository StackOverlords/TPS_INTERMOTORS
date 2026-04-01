import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';
import type { IncomePayload } from '../types/cashMovement.types';

interface RegisterIncomeParams {
    sessionId: number;
    data: IncomePayload;
}

export const useRegisterIncome = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data }: RegisterIncomeParams) => cashService.registerIncome(data),
        onSuccess: (_result, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessionDetail(sessionId) });
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.movements() });
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessions() });
        },
    });
};
