const BASE_PATH = '/employees';
export const EMPLOYEE_ENDPOINTS = {
    all: `${BASE_PATH}`,
    create: `${BASE_PATH}`,
    getById: (id: number) => `${BASE_PATH}/${id}`,
    update: (id: number) => `${BASE_PATH}/${id}`,
    delete: (id: number) => `${BASE_PATH}/${id}`,
    restore: (id: number) => `${BASE_PATH}/${id}/restore`,
} as const;
