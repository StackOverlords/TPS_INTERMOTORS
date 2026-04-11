import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ALERTS_QUERY_KEYS } from "@/lib/queryKeys";
import { alertService } from "../../services/alertService";

interface MarkAllAlertsReadParams {
    sucursal: number;
    tipo_documento: "CxP" | "CxC";
}

/**
 * Hook para marcar todas las alertas como leídas para una sucursal y tipo de documento
 *
 * PATCH /api/v1/accounts-payable/alerts/read-all?sucursal=X&tipo_documento=CxP
 * PATCH /api/v1/accounts-receivable/alerts/read-all?sucursal=X&tipo_documento=CxC
 *
 * Invalida ALERTS_QUERY_KEYS.all on success para refrescar listas y conteos.
 */
const useMarkAllAlertsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sucursal, tipo_documento }: MarkAllAlertsReadParams) =>
            alertService.markAllRead(sucursal, tipo_documento),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ALERTS_QUERY_KEYS.all,
            });
        },
    });
};

export default useMarkAllAlertsRead;
