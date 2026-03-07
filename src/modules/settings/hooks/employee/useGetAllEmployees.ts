import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { EmployeeFilters } from "../../types/employee.types";
import { EMPLOYEE_QUERY_KEYS } from "../../constants/employeeQueryKeys";
import { employeesService } from "../../services/employee.service";

export const useGetAllEmployees = (filters: EmployeeFilters) => {
  return useQuery({
    queryKey: EMPLOYEE_QUERY_KEYS.list(filters),
    queryFn: () => employeesService.getAll(filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!filters.pagina && !!filters.pagina_registros,
  });
};
