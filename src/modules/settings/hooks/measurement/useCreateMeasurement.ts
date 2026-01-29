import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateMeasurement } from "../../types/measurement.types";
import { measurementsService } from "../../services/measurement.service";
import { MEASUREMENT_QUERY_KEYS } from "../../constants/measurementQueryKeys";

export const useCreateMeasurement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateMeasurement) => measurementsService.create(data),
        onSuccess: () => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: MEASUREMENT_QUERY_KEYS.lists() });
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "common-measurements"],
                refetchType: 'active'
            });
        }
    });
};
