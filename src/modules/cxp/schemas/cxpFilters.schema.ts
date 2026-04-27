import { z } from "zod";

export const PAYMENT_TERM_TYPES = {
    "SIN PLAZO": "Pendiente",
    "VENCIDO": "Vencido",
    "POR VENCER EN 15 DIAS": "Por vencer en 15 días",
    "POR VENCER EN 30 DIAS": "Por vencer en 30 días",
    "POR VENCER EN 45 DIAS": "Por vencer en 45 días",
} as const;

export type PaymentTermType = keyof typeof PAYMENT_TERM_TYPES;

export const CxPFiltersSchema = z.object({
    sucursal: z.number().int().optional(),
    proveedor: z.number().int().nullable().optional(),
    fecha_inicio: z.string().optional(),
    fecha_fin: z.string().optional(),
    pagina: z.number().int().positive().optional(),
    pagina_registros: z.number().int().positive().optional(),
    estado_pago: z.enum(["PAGADO", "DEUDA"]).optional(),
    condicion_vencimiento: z.boolean().optional(),
    tipo_vencimiento: z.string().optional(),
    condicion_fecha_especifica: z.boolean().optional(),
    fecha_vencimiento_regla: z.enum([">=", "<=", "="]).optional(),
    fecha_vencimiento: z.string().optional(),
});

export type CxPFilters = z.infer<typeof CxPFiltersSchema>;
