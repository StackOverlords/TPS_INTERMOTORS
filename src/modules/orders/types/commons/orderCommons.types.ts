import type z from "zod";
import type { OrderModalitiesListSchema, OrderModalitiesSchema } from "../../schemas/commons/orderModalities.schema";
import type { OrderProviderGetSchema, OrderProvidersGetAllSchema } from "../../schemas/commons/orderProviders.schema";
import type { OrderResponsibleGetSchema, OrderResponsiblesGetAllSchema } from "../../schemas/commons/orderResponsibles.schema";
import type { OrderStatusListSchema, OrderStatusSchema } from "../../schemas/commons/orderStatus.schema";
import type { OrderTypesListSchema, OrderTypesSchema } from "../../schemas/commons/orderTypes.schema";

// order modalities
export type OrderModalitiesList = z.infer<typeof OrderModalitiesListSchema>
export type OrderModality = z.infer<typeof OrderModalitiesSchema>

//order providers
export type OrderProviderGet = z.infer<typeof OrderProviderGetSchema>
export type OrderProvidersGetAll = z.infer<typeof OrderProvidersGetAllSchema>

//order responsibles
export type OrderResponsibleGet = z.infer<typeof OrderResponsibleGetSchema>
export type OrderResponsiblesGetAll = z.infer<typeof OrderResponsiblesGetAllSchema>

//order status
export type OrderStatusList = z.infer<typeof OrderStatusListSchema>
export type OrderStatus = z.infer<typeof OrderStatusSchema>

// order types
export type OrderTypesList = z.infer<typeof OrderTypesListSchema>
export type OrderType = z.infer<typeof OrderTypesSchema>