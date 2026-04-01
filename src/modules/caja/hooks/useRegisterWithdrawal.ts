import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';
import type { WithdrawalPayload } from '../types/cashMovement.types';

interface RegisterWithdrawalParams {
    sessionId: number;
    data: WithdrawalPayload;
}

export const useRegisterWithdrawal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data }: RegisterWithdrawalParams) => cashService.registerWithdrawal(data),
        onSuccess: (_result, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessionDetail(sessionId) });
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.movements() });
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessions() });
        },
    });
};
