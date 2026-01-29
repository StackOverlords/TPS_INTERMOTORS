import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateVehicleBrand } from "../../types/vehicleBrand.types";
import { vehiclebrandsService } from "../../services/vehicleBrand.service";
import { VEHICLE_BRAND_QUERY_KEYS } from "../../constants/vehicleBrandQueryKeys";

type UpdateParams = {
    id: number;
    data: UpdateVehicleBrand;
};

export const useUpdateVehicleBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: UpdateParams) => vehiclebrandsService.update(id, data),
        onSuccess: (updated, { id }) => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: VEHICLE_BRAND_QUERY_KEYS.lists() });
            queryClient.setQueryData(VEHICLE_BRAND_QUERY_KEYS.detail(id), updated);
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "common-vehicle-brands"],
                refetchType: 'active'
            });
        }
    });
};