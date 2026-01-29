import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateVehicleBrand } from "../../types/vehicleBrand.types";
import { vehiclebrandsService } from "../../services/vehicleBrand.service";
import { VEHICLE_BRAND_QUERY_KEYS } from "../../constants/vehicleBrandQueryKeys";

export const useCreateVehicleBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateVehicleBrand) => vehiclebrandsService.create(data),
        onSuccess: () => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: VEHICLE_BRAND_QUERY_KEYS.lists() });
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "common-vehicle-brands"],
                refetchType: 'active'
            });
        }
    });
};