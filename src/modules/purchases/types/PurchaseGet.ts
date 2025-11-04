import { z } from "zod"
import type { PurchaseGetSchema } from "../schemas/purchaseList.schema"

export type PurchaseGet = z.infer<typeof PurchaseGetSchema>
