import { z } from 'zod';

export const UpdatePricesSchema = z.object({
  categoria: z.number({
    required_error: 'Selecciona una categoría',
  }).int().positive('Selecciona una categoría válida'),

  aplicar_todas: z.boolean(),

  incremento: z.number({
    required_error: 'El incremento es requerido',
  }).min(-100, 'El incremento mínimo es -100%')
    .max(1000, 'El incremento máximo es 1000%'),

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
);

export type UpdatePricesFormData = z.infer<typeof UpdatePricesSchema>;
