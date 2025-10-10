import type z from "zod";
import type {
    LocationItemSchema,
    CountriesResponseSchema,
    StatesResponseSchema,
    CitiesResponseSchema
} from "../schemas/commonLocation.schema";

export type LocationItem = z.infer<typeof LocationItemSchema>
export type CountriesResponse = z.infer<typeof CountriesResponseSchema>
export type StatesResponse = z.infer<typeof StatesResponseSchema>
export type CitiesResponse = z.infer<typeof CitiesResponseSchema>
