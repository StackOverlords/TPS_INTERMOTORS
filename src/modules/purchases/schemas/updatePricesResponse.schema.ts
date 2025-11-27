import { z } from 'zod';

export const UpdatePricesResponseSchema = z.union([
  z.object({
    success: z.boolean(),
    message: z.string(),
    updated_count: z.number().optional(),
    affected_products: z.number().optional(),
  }),
  z.string().transform((val) => {
    // Si la API devuelve un string vacío (o cualquier string), asumimos éxito
    return {
      success: true,
      message: val || 'Precios actualizados correctamente',
      updated_count: 0,
      affected_products: 0,
    };
  }),
]);
