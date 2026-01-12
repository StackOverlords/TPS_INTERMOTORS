import {
  multiplyPrecise,
  calculateAmountFromPercent,
} from "@/utils/decimalUtils";
import type { CartItem } from "../types/cart.types";
import type { SaleDetail } from "@/modules/sales/types/sale";
import type { QuotationDetail } from "@/modules/quotations/types/quotationCreate.types";

/**
 * Calcula el monto de descuento para un item específico con precisión
 */
export const calculateItemDiscount = (
  price: number,
  quantity: number,
  discountPercent: number
): number => {
  // Subtotal del item
  const itemSubtotal = multiplyPrecise(price, quantity);

  // Aplicar porcentaje de descuento
  return calculateAmountFromPercent(discountPercent, itemSubtotal);
};

/**
 * Convierte items del carrito a detalles de venta con cálculos precisos
 */
export const convertCartToSaleDetails = (
  items: CartItem[],
  discountPercent: number
): SaleDetail[] => {
  return items.map((item, index) => {
    const precio = item.customPrice ?? 0;
    const cantidad = item.quantity;

    // Calcular descuento con precisión
    const descuento = calculateItemDiscount(
      precio,
      cantidad,
      discountPercent ?? 0
    );

    return {
      id_producto: item.product.id,
      cantidad,
      precio,
      descuento,
      porcentaje_descuento: discountPercent ?? 0,
      orden: index + 1,
    };
  });
};

/**
 * Convierte items del carrito a detalles de cotización con cálculos precisos
 */
export const convertCartToQuotationDetails = (
  items: CartItem[],
  discountPercent: number
): QuotationDetail[] => {
  return items.map((item, index) => {
    const precio = item.customPrice ?? 0;
    const cantidad = item.quantity;

    // Calcular descuento con precisión
    const descuento = calculateItemDiscount(
      precio,
      cantidad,
      discountPercent ?? 0
    );

    return {
      id_producto: item.product.id,
      cantidad,
      precio,
      descuento,
      porcentaje_descuento: discountPercent ?? 0,
      descripcion: item.customDescription,
      nueva_marca: item.customBrand,
      orden: index + 1,
    };
  });
};
