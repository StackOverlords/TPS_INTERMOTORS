const BASE_PATH = "/employees/commons";
export const COMMON_EMPLOYEE_ENDPOINTS = {
  gender_types: `${BASE_PATH}/gender_types`,
  dni_types: `${BASE_PATH}/dni_types`,
} as const;
