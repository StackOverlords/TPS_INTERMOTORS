import { useQuery } from "@tanstack/react-query";
import { EMPLOYEE_QUERY_KEYS } from "../../constants/employeeQueryKeys";
import { employeesService } from "../../services/employee.service";

export const useGetEmployeeById = (id: number) => {
  return useQuery({
    queryKey: EMPLOYEE_QUERY_KEYS.detail(id),
    queryFn: () => employeesService.getById(id),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!id,
  });
};
