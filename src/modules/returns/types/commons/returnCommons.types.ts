import type z from "zod";
import type { ReturnResponsibleGetSchema, ReturnResponsiblesGetAllSchema } from "../../schemas/commons/returnResponsibles.schema";
import type { ReturnTypesListSchema, ReturnTypesSchema } from "../../schemas/commons/returnTypes.schema";

//Return responsibles
export type ReturnResponsibleGet = z.infer<typeof ReturnResponsibleGetSchema>
export type ReturnResponsiblesGetAll = z.infer<typeof ReturnResponsiblesGetAllSchema>

// Return types
export type ReturnTypesList = z.infer<typeof ReturnTypesListSchema>
export type ReturnType = z.infer<typeof ReturnTypesSchema>