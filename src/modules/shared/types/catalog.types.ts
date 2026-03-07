import { z } from "zod";
import {
  CatalogOptionSchema,
  CatalogOptionListSchema,
  CatalogOptionResponseSchema,
} from "../schemas/catalog.schema";

export type CatalogOption = z.infer<typeof CatalogOptionSchema>;
export type CatalogOptionList = z.infer<typeof CatalogOptionListSchema>;
export type CatalogResponseOptions = z.infer<
  typeof CatalogOptionResponseSchema
>;
