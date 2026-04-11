import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ALERTS_QUERY_KEYS } from "@/lib/queryKeys";
import { alertService } from "../../services/alertService";

interface MarkAlertReadParams {
    id: number;
    tipo_documento: "CxP" | "CxC";
}

/**
 * Hook para marcar una alerta individual como leída
 *
 * PATCH /api/v1/accounts-payable/alerts/{id}/read  (tipo_documento=CxP)
 * PATCH /api/v1/accounts-receivable/alerts/{id}/read (tipo_documento=CxC)
 *
 * Invalida ALERTS_QUERY_KEYS.lists() on success para refrescar el listado.
 */
const useMarkAlertRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, tipo_documento }: MarkAlertReadParams) =>
            alertService.markRead(id, tipo_documento),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ALERTS_QUERY_KEYS.lists(),
            });
        },
    });
};

export default useMarkAlertRead;
