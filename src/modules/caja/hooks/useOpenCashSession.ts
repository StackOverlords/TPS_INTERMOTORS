import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';
import type { OpenSessionPayload } from '../types/cashSession.types';

export const useOpenCashSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: OpenSessionPayload) => cashService.openSession(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CASH_QUERY_KEYS.sessions() });
        },
    });
};
