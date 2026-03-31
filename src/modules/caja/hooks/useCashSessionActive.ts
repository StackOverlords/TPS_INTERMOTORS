import { useQuery } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';

export const useCashSessionActive = (sucursalId: number) => {
    return useQuery({
        queryKey: CASH_QUERY_KEYS.sessionActive(sucursalId),
        queryFn: () => cashService.getSessionActive(sucursalId),
        staleTime: 1000 * 30,
        enabled: !!sucursalId,
        refetchOnWindowFocus: true,
    });
};
