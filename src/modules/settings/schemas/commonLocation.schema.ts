import z from "zod";

export const LocationItemSchema = z.object({
    id: z.number(),
    nombre: z.string(),
});

export const CountriesResponseSchema = z.object({
    data: z.array(LocationItemSchema),
});

export const StatesResponseSchema = z.object({
    data: z.array(LocationItemSchema),
});

export const CitiesResponseSchema = z.object({
    data: z.array(LocationItemSchema),
});
