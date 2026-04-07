import { z } from "zod";

export const CashFlowReportConceptoSchema = z.object({
    concepto: z.string(),
    concepto_label: z.string(),
    tipo_movimiento: z.enum(['INGRESO', 'EGRESO']),
    total: z.coerce.number(),
});

export const CashFlowReportFormaPagoSchema = z.object({
    forma_pago: z.string(),
    forma_pago_label: z.string(),
    total_ingresos: z.coerce.number(),
    total_egresos: z.coerce.number(),
    saldo: z.coerce.number(),
});

export const CashFlowReportFlujoDiarioSchema = z.object({
    fecha: z.string(),
    total_ingresos: z.coerce.number(),
    total_egresos: z.coerce.number(),
    saldo_neto: z.coerce.number(),
});

export const CashFlowReportSchema = z.object({
    sucursal_id: z.number().int(),
    fecha_inicio: z.string(),
    fecha_fin: z.string(),
    total_ingresos: z.coerce.number(),
    total_egresos: z.coerce.number(),
    saldo_neto: z.coerce.number(),
    por_concepto: z.array(CashFlowReportConceptoSchema),
    por_forma_pago: z.array(CashFlowReportFormaPagoSchema),
    flujo_diario: z.array(CashFlowReportFlujoDiarioSchema),
});

export type CashFlowReportType = z.infer<typeof CashFlowReportSchema>;
