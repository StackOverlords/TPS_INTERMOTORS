import { useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesService } from "../../services/employee.service";
import { EMPLOYEE_QUERY_KEYS } from "../../constants/employeeQueryKeys";

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => employeesService.delete(id),
    onSuccess: () => {
      // Settings module
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: EMPLOYEE_QUERY_KEYS.details(),
      });
      // Shared module (filtros productos, crear/editar productos)
      queryClient.invalidateQueries({
        queryKey: ["shared"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["common-employees"],
        refetchType: "active",
      });
    },
    retry: false,
    networkMode: "offlineFirst",
    gcTime: 1000 * 60 * 3,
  });
};
