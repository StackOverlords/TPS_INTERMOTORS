import type z from "zod";
import type {
    BranchSchema,
    CreateBranchSchema,
    CreateBranchResponseSchema,
    GetAllBranchesSchema,
    GetByIdBranchSchema,
    UpdateBranchSchema,
    ContactInfoSchema
} from "../schemas/branch.schema";
import type { PaginationParams } from "../../shared/types/paginationParams";

export type Branch = z.infer<typeof BranchSchema>
export type GetAllBranches = z.infer<typeof GetAllBranchesSchema>
export type CreateBranch = z.infer<typeof CreateBranchSchema>
export type CreateBranchResponse = z.infer<typeof CreateBranchResponseSchema>
export type UpdateBranch = z.infer<typeof UpdateBranchSchema>
export type GetByIdBranch = z.infer<typeof GetByIdBranchSchema>
export type ContactInfo = z.infer<typeof ContactInfoSchema>

export interface BranchFilters extends PaginationParams {
    nombre?: string
    estado?: boolean
}
