import type z from "zod";
import type {
  CreateEmployeeSchema,
  EmployeeFiltersSchema,
  EmployeeSchema,
  GetAllEmployeesSchema,
  GetByIdEmployeeSchema,
  UpdateEmployeeSchema,
} from "../schemas/employee.schema";

export type GetAllEmployeesResponse = z.infer<typeof GetAllEmployeesSchema>;
export type Employee = z.infer<typeof EmployeeSchema>;
export type GetByIdEmployee = z.infer<typeof GetByIdEmployeeSchema>;
export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeFilters = z.infer<typeof EmployeeFiltersSchema>;
