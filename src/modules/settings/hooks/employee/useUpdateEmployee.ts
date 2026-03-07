import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateEmployee } from "../../types/employee.types";
import { employeesService } from "../../services/employee.service";
import { EMPLOYEE_QUERY_KEYS } from "../../constants/employeeQueryKeys";

type UpdateParams = {
  id: number;
  data: UpdateEmployee;
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateParams) =>
      employeesService.update(id, data),
    onSuccess: (updated, { id }) => {
      // Settings module
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEYS.lists() });
      queryClient.setQueryData(EMPLOYEE_QUERY_KEYS.detail(id), updated);
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
  });
};
