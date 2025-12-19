import { z } from "zod"
import type { ProductGetByIdWithStockSchema } from "../schemas/ProductGetByIdWithStock.schema"

export type ProductGetByIdWithStock = z.infer<typeof ProductGetByIdWithStockSchema>
