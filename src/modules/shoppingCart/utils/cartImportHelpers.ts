// Funciones auxiliares para importar cotizaciones al carrito

import type {
  CartItem,
  CartProduct,
} from "@/modules/shoppingCart/types/cart.types";
import type {
  QuotationGetById,
  QuotationItemGetById,
} from "@/modules/quotations/types/quotationGet.types";
import { CartProductSchema } from "@/modules/shoppingCart/schemas/cartProduct.schema";
import { multiplyPrecise, roundTo5Decimals } from "@/utils/decimalUtils";

/**
 * Convierte un detalle de cotización a un producto del carrito
 */
export const quotationItemToCartProduct = (
  quotationItem: QuotationItemGetById,
): CartProduct => {
  const product = quotationItem.producto;

  const item: CartProduct = {
    categoria: product.categoria?.categoria ?? "",
    codigo_oem: product.codigo_oem,
    codigo_upc: product.codigo_upc,
    descripcion: product.descripcion,
    id: product.id,
    marca: product.marca?.marca ?? "",
    medida: product.medida,
    precio_venta: product.precio_venta,
    precio_venta_alt: product.precio_venta_alt,
    stock_actual: product.stock_actual ?? 0,
    sucursal: "",
    unidad_medida: product.unidad_medida?.unidad_medida ?? "",
  };
  // Usar el schema para validar y transformar
  return CartProductSchema.parse(item);
};

/**
 * Convierte un detalle de cotización a un CartItem completo
 * con los precios y cantidades de la cotización
 */
export const quotationItemToCartItem = (
  quotationItem: QuotationItemGetById,
): CartItem => {
  const cartProduct = quotationItemToCartProduct(quotationItem);

  // Usar el precio y cantidad de la cotización
  const price = roundTo5Decimals(quotationItem.precio);
  const quantity = quotationItem.cantidad;
  const subtotal = multiplyPrecise(price, quantity);

  return {
    product: cartProduct,
    quantity: quantity,
    customPrice: price,
    customSubtotal: subtotal,
    customDescription: quotationItem.descripcion || cartProduct.descripcion,
    customBrand: quotationItem.marca || cartProduct.marca,
  };
};

/**
 * Extrae los datos del formulario desde una cotización
 */
export interface QuotationFormData {
  id_cliente?: number;
  cliente_nombre?: string;
  cliente_nit?: string;
  nro_comprobante?: string;
  nro_comprobante2?: string;
  tipo_venta?: string;
  forma_venta?: string;
  plazo_pago?: string;
  vehiculo?: string;
  nro_motor?: string;
  comentario?: string;
  /** Anticipo ya cobrado en la cotización-pedido. Se acredita al total de la venta
   *  sin generar movimiento de caja nuevo (ya entró como ANTICIPO_COTIZACION). */
  anticipo?: number;
  /** Forma de pago con la que se cobró el anticipo (código PaymentTypes). */
  forma_pago_anticipo?: string;
}

export const extractFormDataFromQuotation = (
  quotation: QuotationGetById,
): QuotationFormData => {
  return {
    id_cliente: quotation.cliente?.id,
    cliente_nombre: quotation.cliente_nombre || undefined,
    cliente_nit: quotation.cliente_nit || undefined,
    nro_comprobante: quotation.comprobante || undefined,
    nro_comprobante2: quotation.comprobante2 || undefined,
    tipo_venta: quotation.tipo_cotizacion,
    forma_venta: quotation.forma_cotizacion,
    plazo_pago: quotation.plazo_pago || undefined,
    vehiculo: quotation.vehiculo || undefined,
    nro_motor: quotation.nmotor || undefined,
    comentario: quotation.comentarios || undefined,
    anticipo: quotation.anticipo || undefined,
    forma_pago_anticipo: quotation.forma_pago_anticipo || undefined,
  };
};

/**
 * Información de descuento extraída de la cotización
 */
export interface QuotationDiscountInfo {
  hasDiscount: boolean;
  discountPercent: number;
}

/**
 * Extrae el descuento global de la cotización
 * En el sistema, el descuento es GLOBAL y se aplica con un único porcentaje
 * a todos los productos. Este porcentaje se obtiene del primer detalle que tenga descuento.
 */
export const extractDiscountFromQuotation = (
  quotation: QuotationGetById,
): QuotationDiscountInfo => {
  if (!quotation.detalles || quotation.detalles.length === 0) {
    return {
      hasDiscount: false,
      discountPercent: 0,
    };
  }

  // Buscar el primer detalle que tenga un porcentaje de descuento
  // Como el descuento es global, todos los productos tendrían el mismo porcentaje
  const detalleConDescuento = quotation.detalles.find(
    (detalle) =>
      detalle.porcentaje_descuento && detalle.porcentaje_descuento > 0,
  );

  if (!detalleConDescuento || !detalleConDescuento.porcentaje_descuento) {
    return {
      hasDiscount: false,
      discountPercent: 0,
    };
  }

  const discountPercent = roundTo5Decimals(
    detalleConDescuento.porcentaje_descuento,
  );

  return {
    hasDiscount: discountPercent > 0,
    discountPercent,
  };
};
