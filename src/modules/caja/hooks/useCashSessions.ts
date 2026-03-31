import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';
import type { CashSessionFilters } from '../types/cashFilters.types';

export const useCashSessions = (filters: Partial<CashSessionFilters>) => {
    return useQuery({
        queryKey: CASH_QUERY_KEYS.sessionList(filters),
        queryFn: () => cashService.getSessions(filters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 2,
        enabled: !!filters.sucursal,
    });
};
