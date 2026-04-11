import { useQuery } from "@tanstack/react-query";
import { accountsReceivableService } from "../../services/accountReceivableService";

export const useTermTypes = () => {
    return useQuery({
        queryKey: ["accountsReceivable", "termTypes"],
        queryFn: () => accountsReceivableService.getTermTypes(),
        staleTime: 1000 * 60 * 60, // 1 hora - los tipos de vencimiento no cambian frecuentemente
    });
};
