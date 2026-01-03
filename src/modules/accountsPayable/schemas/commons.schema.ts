import { z } from "zod";

/**
 * Schema para los tipos de pago
 * Formato: { "EFECTIVO": "Efectivo", "CHEQUE": "Cheque", "TRASNF": "Transferencia", "QR": "QR", "QR-EFECTIVO": "QR y Efectivo" }
 */
export const PaymentTypesSchema = z.record(z.string(), z.string());

/**
 * Schema para los tipos de vencimiento
 * Formato: { "SIN PLAZO": "Pendiente", "VENCIDO": "Vencido", ... }
 */
export const TermTypesSchema = z.record(z.string(), z.string());

export type PaymentTypes = z.infer<typeof PaymentTypesSchema>;
export type TermTypes = z.infer<typeof TermTypesSchema>;
