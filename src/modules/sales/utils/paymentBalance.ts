import {
  addPrecise,
  comparePrecise,
  roundTo5Decimals,
  subtractPrecise,
} from "@/utils/decimalUtils";
import type { SalePaymentMethod } from "../types/sale";

export type BalanceStatus = "pending" | "exact" | "over";

export interface PaymentBalance {
  status: BalanceStatus;
  /** Sum of all split-payment rows (0 when no rows). */
  assigned: number;
  /** Remaining amount when status === 'pending'. 0 otherwise. */
  saldo: number;
  /** Resolved human-readable label for the header forma_pago. */
  headerLabel: string;
}

/**
 * Resolves a human-readable label for a payment-method code.
 * Falls back to the raw code when the catalog has not loaded or does not
 * contain the code — so the amber text always shows something meaningful.
 */
export function resolvePaymentLabel(
  code: string,
  paymentTypes?: { code: string; label: string }[]
): string {
  if (!code) return "";
  if (!paymentTypes || paymentTypes.length === 0) return code;
  const found = paymentTypes.find((pt) => pt.code === code);
  return found ? found.label : code;
}

/**
 * Computes the live payment balance between split-payment rows and the total.
 *
 * Mirror of the backend formula:
 *   total = Σ bcsub(bcmul(precio, cantidad, 5), descuento, 5)   (already done upstream)
 *   saldo = total − Σ monto   (5dp, HALF_UP via decimalUtils / decimal.js)
 *
 * Base case: when formasPago is empty (no split rows) the function returns
 * status "exact" with saldo 0 and assigned 0.  The UI MUST hide feedback
 * in this case (full total goes with the header — no saldo concept).
 *
 * @param formasPago  Current split-payment rows from component state.
 * @param total       Sale total from getCartTotal() or calculateTotal().
 * @param headerFormaPago  The `forma_pago` field value from the form.
 * @param paymentTypes  Optional catalog loaded via useSalePaymentTypes.
 */
export function computePaymentBalance(
  formasPago: SalePaymentMethod[],
  total: number,
  headerFormaPago: string,
  paymentTypes?: { code: string; label: string }[]
): PaymentBalance {
  const headerLabel = resolvePaymentLabel(headerFormaPago, paymentTypes);

  // Base case: no split rows — full total goes with header, no feedback.
  if (!formasPago || formasPago.length === 0) {
    return { status: "exact", assigned: 0, saldo: 0, headerLabel };
  }

  // Normalize total to 5dp so the comparison mirrors the backend's
  // bccomp(x, y, 5), which truncates past the 5th decimal. Keeps this util
  // self-contained — parity holds even if `total` arrives with extra digits.
  const normalizedTotal = roundTo5Decimals(total);

  // Sum all row amounts at 5dp precision (mirrors Σ bcadd on the backend).
  const assigned = formasPago.reduce(
    (acc, fp) => addPrecise(acc, fp.monto || 0),
    0
  );

  const cmp = comparePrecise(assigned, normalizedTotal);

  if (cmp === 1) {
    // assigned > total → overpayment
    return { status: "over", assigned, saldo: 0, headerLabel };
  }

  if (cmp === 0) {
    // assigned === total → exact match
    return { status: "exact", assigned, saldo: 0, headerLabel };
  }

  // assigned < total → saldo pendiente
  const saldo = subtractPrecise(normalizedTotal, assigned);
  return { status: "pending", assigned, saldo, headerLabel };
}
