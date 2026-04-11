import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { TreasuryDashboardSchema, type TreasuryDashboard } from "../schemas/treasury.schema";
import { TREASURY_ENDPOINTS } from "./endpoints";

const MODULE_NAME = "TREASURY_SERVICE";

export const treasuryService = {
    /**
     * Obtener el dashboard de tesorería para una sucursal
     *
     * Incluye: posición neta, totales CxP/CxC, proyecciones y contadores de alertas.
     * Si posicion_neta < 0 → mostrar en rojo en el dashboard.
     *
     * GET /api/v1/treasury/dashboard?sucursal={id}
     */
    async getDashboard(sucursal: number): Promise<TreasuryDashboard> {
        Logger.info("Fetching treasury dashboard", { sucursal }, MODULE_NAME);
        const response = await ApiService.get(
            TREASURY_ENDPOINTS.dashboard,
            TreasuryDashboardSchema,
            { params: { sucursal } },
        );
        Logger.info("Treasury dashboard fetched successfully", {}, MODULE_NAME);
        return response as TreasuryDashboard;
    },
};
