import { z } from "zod";

export const updatePurchaseDetailPricesSchema = z.object({
  precio_venta: z.number({
    invalid_type_error: "El precio de venta debe ser un número",
  }),
  precio_venta_alt: z.number({
    invalid_type_error: "El precio de venta alternativo debe ser un número",
  }),
  incremento_p_venta: z.number({
    invalid_type_error: "El incremento del precio de venta debe ser un número",
  }),
  incremento_p_venta_alt: z.number({
    invalid_type_error:
      "El incremento del precio de venta alternativo debe ser un número",
  }),
  detalles: z
    .array(
      z
        .number({
          required_error: "El id del detalle es obligatorio",
          invalid_type_error: "El id del detalle debe ser un número",
        })
        .int("El id del detalle debe ser un número entero")
    )
    .min(1, "Debe seleccionar al menos un detalle de compra"),
});
