import { z } from 'zod';

export const UpdatePricesSchema = z.object({
  categoria: z.number().int().positive().optional().nullable(),

  aplicar_todas: z.boolean(),

  aplicar_todo_sistema: z.boolean(),

  tipo_ajuste: z.enum(['incremento', 'decremento'], {
    required_error: 'Selecciona el tipo de ajuste',
  }),

  porcentaje: z.number({
    required_error: 'El porcentaje es requerido',
    invalid_type_error: 'Ingresa un valor numérico',
  })
    .positive('El porcentaje debe ser mayor a 0')
    .max(1000, 'El porcentaje máximo es 1000%')
    .refine((val) => val !== 0, {
      message: 'El porcentaje debe ser mayor a 0',
    }),

  sucursal: z.number().int().positive().optional().nullable(),

  fecha: z.string().optional().nullable(),
}).refine(
  (data) => {
    // Si aplicar_todas es false, sucursal es requerida
    if (!data.aplicar_todas && !data.sucursal) {
      return false;
    }
    return true;
  },
  {
    message: 'Debes seleccionar una sucursal o aplicar a todas',
    path: ['sucursal'],
  }
).refine(
  (data) => {
    // Si NO se aplica a todo el sistema, la categoría es requerida
    if (!data.aplicar_todo_sistema && !data.categoria) {
      return false;
    }
    return true;
  },
  {
    message: 'Debes seleccionar una categoría o aplicar a todo el sistema',
    path: ['categoria'],
  }
);

export type UpdatePricesFormData = z.infer<typeof UpdatePricesSchema>;

// Tipo para el API (formato que espera el backend)
export interface UpdatePricesApiData {
  categoria?: number | null;
  aplicar_todas: boolean;
  incremento: number;
  sucursal?: number | null;
  fecha?: string | null;
}

// Helper para convertir el formulario al formato del API
export const transformToApiFormat = (data: UpdatePricesFormData): UpdatePricesApiData => {
  const incremento = data.tipo_ajuste === 'incremento'
    ? data.porcentaje
    : -data.porcentaje;

  return {
    categoria: data.aplicar_todo_sistema ? null : data.categoria,
    aplicar_todas: data.aplicar_todas,
    incremento,
    sucursal: data.sucursal,
    fecha: data.fecha,
  };
};
