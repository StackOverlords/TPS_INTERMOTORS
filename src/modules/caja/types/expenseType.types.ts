export interface ExpenseType {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    fecha_reg: string;
}

export interface CreateExpenseTypePayload {
    unidad_organizativa_id: number;
    nombre: string;
    descripcion?: string;
}

export interface UpdateExpenseTypePayload {
    unidad_organizativa_id: number;
    nombre: string;
    descripcion?: string;
}
