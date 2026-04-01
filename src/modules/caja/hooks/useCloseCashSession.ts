import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';
import type { CloseSessionPayload } from '../types/cashSession.types';

interface CloseCashSessionParams {
    id: number;
    data: CloseSessionPayload;
}

export const useCloseCashSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: CloseCashSessionParams) => cashService.closeSession(id, data),
        onSuccess: (_result, { id }) => {
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessions() });
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessionDetail(id) });
        },
    });
};
