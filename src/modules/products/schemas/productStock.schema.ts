import { toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";
import { z } from "zod";

const toNumber = z.preprocess((val) => {
    if (typeof val === "string") return Number(val);
    return val;
}, z.number());

export const ProductStockSchema = z.object({
    id: z.number(),
    cantidad: toNumber,
    costo: toNumber,
    precio_venta: toNumber,
    precio_venta_alt: toNumber,
    saldo: toNumber,
    nro_adquisicion: z.number(),
    fecha_adquisicion: z.string(),
    fecha_actualizacion: z.string().nullable(),
    tipo: z.string(),
    sucursal: z.string(),
    tc_compra: toNumberOrZeroStrict
});

export const ProductStockListSchema = z.array(ProductStockSchema);
