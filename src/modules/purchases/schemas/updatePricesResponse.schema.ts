import { z } from 'zod';

export const UpdatePricesResponseSchema = z.union([
  z.object({
    success: z.boolean(),
    message: z.string(),
    updated_count: z.number().optional(),
    affected_products: z.number().optional(),
  }),
  z.string().transform((val) => ({
    success: true,
    message: val || 'Precios actualizados correctamente',
    updated_count: 0,
    affected_products: 0,
  })),
  // Manejar respuestas vacías/null del backend
  z.null().transform(() => ({
    success: true,
    message: 'Precios actualizados correctamente',
    updated_count: 0,
    affected_products: 0,
  })),
  z.undefined().transform(() => ({
    success: true,
    message: 'Precios actualizados correctamente',
    updated_count: 0,
    affected_products: 0,
  })),
]);
