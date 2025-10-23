import type z from "zod";
import type {
    TransferResponsiblesGetAllSchema,
    TransferResponsibleGetSchema,
    TransferBranchesGetAllSchema,
    TransferBranchGetSchema
} from "../../schemas/commons/transferCommons.schema";

// Responsables
export type TransferResponsibleGet = z.infer<typeof TransferResponsibleGetSchema>;
export type TransferResponsiblesGetAll = z.infer<typeof TransferResponsiblesGetAllSchema>;

// Sucursales
export type TransferBranchGet = z.infer<typeof TransferBranchGetSchema>;
export type TransferBranchesGetAll = z.infer<typeof TransferBranchesGetAllSchema>;
