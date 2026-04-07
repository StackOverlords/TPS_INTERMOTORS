import { z } from "zod";
import type { SaleDetailListSchema, SaleDetailSchema, SalePaymentMethodSchema, SaleSchema } from "../schemas/sales.schema";

export type Sale = z.infer<typeof SaleSchema>;
export type SaleDetail = z.infer<typeof SaleDetailSchema>;
export type SaleDetailList = z.infer<typeof SaleDetailListSchema>;
export type SalePaymentMethod = z.infer<typeof SalePaymentMethodSchema>;