import { PurchaseGetSchema } from "./purchaseList.schema"
import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema"

export const PurchaseListResponseSchema = paginatedResponseSchema(PurchaseGetSchema)