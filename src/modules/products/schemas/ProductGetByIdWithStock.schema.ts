import z from "zod";
import { ProductDetailSchema } from "./ProductDetail.schema";
import { toNumberOrZeroStrict } from "@/modules/shared/schemas/numberSchemas";

export const ProductGetByIdWithStockSchema = z.object({
    data: ProductDetailSchema,
    stock_actual: toNumberOrZeroStrict,
    stock_resto: toNumberOrZeroStrict,
})