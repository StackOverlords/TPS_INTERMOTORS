import z from "zod";

export const SaleCodeSchema = z.string()
export const SaleDescriptionSchema = z.string();

export const SaleTypesResponseSchema = z.record(SaleCodeSchema, SaleDescriptionSchema);

export const SaleTypesSchema = z.object({
    code: z.string(),
    label: z.string(),
});
export const SaleTypesListSchema = z.array(SaleTypesSchema);