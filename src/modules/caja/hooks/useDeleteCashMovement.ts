import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';

export const useDeleteCashMovement = (sessionId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (movementId: number) => cashService.deleteMovement(movementId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessionDetail(sessionId) });
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessionArqueo(sessionId) });
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessions() });
        },
    });
};
