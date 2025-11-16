import { useQuery } from "@tanstack/react-query";
import { accountsPayableService } from "../../services/accountPayableService";

export const useTermTypes = () => {
    return useQuery({
        queryKey: ["accountsPayable", "termTypes"],
        queryFn: () => accountsPayableService.getTermTypes(),
        staleTime: 1000 * 60 * 60, // 1 hora - los tipos de vencimiento no cambian frecuentemente
    });
};
