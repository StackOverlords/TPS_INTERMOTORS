import { ApiService } from "@/lib/apiService";
import logger from "@/utils/logger";
import { EMPLOYEE_ENDPOINTS } from "./endpoints/employeeEndpoints.service";
import type {
  CreateEmployee,
  EmployeeFilters,
  GetAllEmployeesResponse,
  GetByIdEmployee,
  UpdateEmployee,
} from "../types/employee.types";
import {
  GetAllEmployeesSchema,
  GetByIdEmployeeSchema,
} from "../schemas/employee.schema";

const MODULE_NAME = "EMPLOYEE_SERVICE";

export const employeesService = {
  /**
   * Crear un nuevo empleado
   * @param data - Datos del empleado a crear
   */
  async create(data: CreateEmployee): Promise<GetByIdEmployee> {
    logger.info("Creating Employee", { data }, MODULE_NAME);

    const response = await ApiService.post(
      EMPLOYEE_ENDPOINTS.create,
      data,
      GetByIdEmployeeSchema,
      undefined,
      { unwrapData: true },
    );

    logger.info("Employee created successfully", undefined, MODULE_NAME);
    return response;
  },

  /**
   * Obtener todos los empleados con filtros opcionales
   */
  async getAll(
    filters: Partial<EmployeeFilters>,
  ): Promise<GetAllEmployeesResponse> {
    logger.info("Fetching Employees", { filters }, MODULE_NAME);

    const response = await ApiService.get(
      EMPLOYEE_ENDPOINTS.all,
      GetAllEmployeesSchema,
      { params: filters },
    );

    logger.info(
      "Employees fetched successfully",
      {
        count: response.data.length,
      },
      MODULE_NAME,
    );

    return response;
  },

  /**
   * Obtener un empleado por ID
   * @param id - ID del empleado
   */
  async getById(id: number): Promise<GetByIdEmployee> {
    logger.info("Fetching Employee detail", { id }, MODULE_NAME);

    const response = await ApiService.get(
      EMPLOYEE_ENDPOINTS.getById(id),
      GetByIdEmployeeSchema,
      undefined,
      { unwrapData: true },
    );

    logger.info(
      "Employee detail fetched successfully",
      {
        id,
      },
      MODULE_NAME,
    );

    return response;
  },

  /**
   * Actualizar un empleado por ID
   * @param id - ID del empleado
   * @param data - Datos para actualizar el empleado
   */
  async update(id: number, data: UpdateEmployee): Promise<GetByIdEmployee> {
    logger.info("Updating Employee", { id, data }, MODULE_NAME);

    const response = await ApiService.put(
      EMPLOYEE_ENDPOINTS.update(id),
      data,
      GetByIdEmployeeSchema,
      undefined,
      { unwrapData: true },
    );

    logger.info(
      "Employee updated successfully",
      {
        id,
      },
      MODULE_NAME,
    );
    return response;
  },

  /**
   * Eliminar un empleado por ID
   * @param id - ID del empleado
   */
  async delete(id: number): Promise<void> {
    logger.info("Deleting Employee", { id }, MODULE_NAME);

    await ApiService.delete(EMPLOYEE_ENDPOINTS.delete(id));

    logger.info("Employee deleted successfully", { id }, MODULE_NAME);
  },

  /**
   * Restaurar un empleado eliminado por ID
   * @param id - ID del empleado
   */
  async restore(id: number): Promise<void> {
    logger.info("Restoring Employee", { id }, MODULE_NAME);

    await ApiService.put(EMPLOYEE_ENDPOINTS.restore(id));

    logger.info("Employee restored successfully", { id }, MODULE_NAME);
  },
};
