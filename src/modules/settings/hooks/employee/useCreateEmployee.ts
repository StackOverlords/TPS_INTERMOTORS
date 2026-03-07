import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateEmployee } from "../../types/employee.types";
import { employeesService } from "../../services/employee.service";
import { EMPLOYEE_QUERY_KEYS } from "../../constants/employeeQueryKeys";

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployee) => employeesService.create(data),
    onSuccess: () => {
      // Settings module
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.lists() });
      // Shared module (filtros productos, crear/editar productos)
      queryClient.invalidateQueries({
        queryKey: ["common-employees"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["shared"],
        refetchType: "active",
      });
    },
  });
};
