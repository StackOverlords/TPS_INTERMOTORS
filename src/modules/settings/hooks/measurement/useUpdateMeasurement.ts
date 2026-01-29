import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateMeasurement } from "../../types/measurement.types";
import { measurementsService } from "../../services/measurement.service";
import { MEASUREMENT_QUERY_KEYS } from "../../constants/measurementQueryKeys";

type UpdateParams = {
    id: number;
    data: UpdateMeasurement;
};

export const useUpdateMeasurement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: UpdateParams) => measurementsService.update(id, data),
        onSuccess: (updated, { id }) => {
            // Settings module
            queryClient.invalidateQueries({ queryKey: MEASUREMENT_QUERY_KEYS.lists() });
            queryClient.setQueryData(MEASUREMENT_QUERY_KEYS.detail(id), updated);
            // Shared module (filtros productos, crear/editar productos)
            queryClient.invalidateQueries({
                queryKey: ["shared", "common-measurements"],
                refetchType: 'active'
            });
        }
    });
};