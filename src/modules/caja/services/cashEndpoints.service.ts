const BASE_PATH = '/cash';

export const CASH_ENDPOINTS = {
    sessions: {
        all: `${BASE_PATH}/sessions`,
        active: `${BASE_PATH}/sessions/active`,
        byId: (id: number) => `${BASE_PATH}/sessions/${id}`,
        close: (id: number) => `${BASE_PATH}/sessions/${id}/close`,
        movements: (id: number) => `${BASE_PATH}/sessions/${id}/movements`,
    },
    movements: {
        all: `${BASE_PATH}/movements`,
        income: `${BASE_PATH}/movements/income`,
        withdrawal: `${BASE_PATH}/movements/withdrawal`,
        expenses: `${BASE_PATH}/movements/expenses`,
    },
    expenseTypes: {
        all: `${BASE_PATH}/expense-types`,
        byId: (id: number) => `${BASE_PATH}/expense-types/${id}`,
    },
} as const;
