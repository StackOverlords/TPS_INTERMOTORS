import { z } from "zod";

const CatalogCodeSchema = z.string();
const CatalogLabelSchema = z.string();

export const CatalogOptionResponseSchema = z.record(
  CatalogCodeSchema,
  CatalogLabelSchema,
);

export const CatalogOptionSchema = z.object({
  code: z.string(),
  label: z.string(),
});

export const CatalogOptionListSchema = z.array(CatalogOptionSchema);
