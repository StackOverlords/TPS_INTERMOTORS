import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';
import type { CashMovementFilters } from '../types/cashFilters.types';

export const useCashMovements = (filters: Partial<CashMovementFilters>) => {
    return useQuery({
        queryKey: CASH_QUERY_KEYS.movementList(filters),
        queryFn: () => cashService.getMovements(filters),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60,
        enabled: !!filters.sucursal || !!filters.caja_sesion_id,
    });
};
