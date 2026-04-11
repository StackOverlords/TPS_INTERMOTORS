import { z } from "zod";

/**
 * Schema para los tipos de pago (CxP)
 * Formato: { "EFECTIVO": "Efectivo", "CHEQUE": "Cheque", "TRASNF": "Transferencia", "QR": "QR" }
 */
export const CxPPaymentTypesSchema = z.record(z.string(), z.string());

/**
 * Schema para los tipos de plazo (CxP)
 * Formato: { "SIN PLAZO": "Pendiente", "VENCIDO": "Vencido", ... }
 */
export const CxPTermTypesSchema = z.record(z.string(), z.string());

export type CxPPaymentTypes = z.infer<typeof CxPPaymentTypesSchema>;
export type CxPTermTypes = z.infer<typeof CxPTermTypesSchema>;
