import { useQuery } from '@tanstack/react-query';
import { CASH_QUERY_KEYS } from '../constants/cashQueryKeys';
import { cashService } from '../services/cash.service';

interface UseCashFlowReportParams {
    sucursalId: number;
    fechaInicio: string;
    fechaFin: string;
}

export const useCashFlowReport = ({ sucursalId, fechaInicio, fechaFin }: UseCashFlowReportParams) => {
    return useQuery({
        queryKey: CASH_QUERY_KEYS.flowReport(sucursalId, fechaInicio, fechaFin),
        queryFn: () => cashService.getFlowReport(sucursalId, fechaInicio, fechaFin),
        enabled: !!sucursalId && !!fechaInicio && !!fechaFin,
        staleTime: 1000 * 60 * 5,
    });
};
