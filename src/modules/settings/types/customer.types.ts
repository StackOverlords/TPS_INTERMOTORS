import type z from "zod";
import type {
    CustomerSchema,
    CreateCustomerSchema,
    GetAllCustomersSchema,
    GetByIdCustomerSchema,
    UpdateCustomerSchema
} from "../schemas/customer.schema";
import type { PaginationParams } from "../../shared/types/paginationParams";

export type Customer = z.infer<typeof CustomerSchema>
export type GetAllCustomers = z.infer<typeof GetAllCustomersSchema>
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>
export type GetByIdCustomer = z.infer<typeof GetByIdCustomerSchema>

export interface CustomerFilters extends PaginationParams {
    cliente?: string
    nit?: string
    codigo_interno?: number
    activo?: number  // 1 o 0
}
