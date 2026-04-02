import { useQuery } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';

export const useCashSessionArqueo = (sessionId: number, enabled = true) => {
    return useQuery({
        queryKey: CASH_QUERY_KEYS.sessionArqueo(sessionId),
        queryFn: () => cashService.getSessionArqueo(sessionId),
        enabled: !!sessionId && enabled,
        staleTime: 1000 * 15,
    });
};
