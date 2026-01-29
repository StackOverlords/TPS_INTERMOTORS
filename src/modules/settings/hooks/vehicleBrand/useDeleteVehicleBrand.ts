import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclebrandsService } from "../../services/vehicleBrand.service";
import { VEHICLE_BRAND_QUERY_KEYS } from "../../constants/vehicleBrandQueryKeys";

export const useDeleteVehicleBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => vehiclebrandsService.delete(id),
        onSuccess: () => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: VEHICLE_BRAND_QUERY_KEYS.lists() });
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "common-vehicle-brands"],
                refetchType: 'active'
            });
        },
        retry: false,
        networkMode: 'offlineFirst',
        gcTime: 1000 * 60 * 3,
    });
};