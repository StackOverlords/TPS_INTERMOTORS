import type z from "zod";
import type { updatePurchaseDetailPricesSchema } from "../schemas/updatePurchaseDetailPrices.schema";

export type UpdatePurchaseDetailPricesFormData =
  z.infer<typeof updatePurchaseDetailPricesSchema>;
