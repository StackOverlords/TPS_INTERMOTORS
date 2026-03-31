import { useQuery } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';

export const useCashSessionDetail = (id: number) => {
    return useQuery({
        queryKey: CASH_QUERY_KEYS.sessionDetail(id),
        queryFn: () => cashService.getSessionById(id),
        staleTime: 1000 * 60,
        enabled: !!id,
    });
};
