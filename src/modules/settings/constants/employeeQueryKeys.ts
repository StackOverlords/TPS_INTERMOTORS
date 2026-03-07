import type { EmployeeFilters } from "../types/employee.types";

export const EMPLOYEE_QUERY_KEYS = {
  all: ["employees"] as const,
  lists: () => [...EMPLOYEE_QUERY_KEYS.all, "list"] as const,
  list: (filters?: EmployeeFilters) =>
    [...EMPLOYEE_QUERY_KEYS.lists(), { filters }] as const,

  details: () => [...EMPLOYEE_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string | number) =>
    [...EMPLOYEE_QUERY_KEYS.details(), id] as const,
};
