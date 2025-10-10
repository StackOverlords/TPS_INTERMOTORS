import type z from "zod";
import type {
    ProviderSchema,
    CreateProviderSchema,
    GetAllProvidersSchema,
    GetByIdProviderSchema,
    UpdateProviderSchema
} from "../schemas/provider.schema";
import type { PaginationParams } from "../../shared/types/paginationParams";

export type Provider = z.infer<typeof ProviderSchema>
export type GetAllProviders = z.infer<typeof GetAllProvidersSchema>
export type CreateProvider = z.infer<typeof CreateProviderSchema>
export type UpdateProvider = z.infer<typeof UpdateProviderSchema>
export type GetByIdProvider = z.infer<typeof GetByIdProviderSchema>

export interface ProviderFilters extends PaginationParams {
    proveedor?: string
    nit?: string
    codigo_interno?: number
    activo?: number  // 1 o 0
}
