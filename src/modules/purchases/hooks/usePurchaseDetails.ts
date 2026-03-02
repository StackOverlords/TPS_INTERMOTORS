import { useState, useCallback, useEffect } from "react";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import {
  multiplyPrecise,
  dividePrecise,
  addPrecise,
  subtractPrecise,
  roundTo5Decimals,
  calculatePercent,
} from "@/utils/decimalUtils";

// ==================== TIPOS ====================
/**
 * Detalle con información completa del producto (para UI)
 */
export interface UIPurchaseDetail {
  id_producto: number;
  cantidad: number;
  costo: number;
  inc_p_venta: number;
  precio_venta: number;
  inc_p_venta_alt: number;
  precio_venta_alt: number;
  tc_compra: number;
  orden: number;
  product: {
    id: number;
    descripcion?: string;
    codigo_oem?: string;
    codigo_interno?: string | number;
    codigo_upc?: string;
    marca?: string;
    categoria?: string;
    procedencia?: string;
  };
}

/**
 * Detalle para crear compra (sin ID de detalle)
 */
export interface PurchaseDetailCreate {
  id_producto: number;
  cantidad: number;
  costo: number;
  inc_p_venta: number;
  precio_venta: number;
  inc_p_venta_alt: number;
  precio_venta_alt: number;
  tc_compra: number;
}

/**
 * Detalle para actualizar compra (con ID de detalle opcional para nuevos)
 */
export interface PurchaseDetailUpdate extends PurchaseDetailCreate {
  id_detalle_compra?: number | null;
}

/**
 * Detalle UI para edición (incluye ID de detalle)
 */
export interface UIPurchaseDetailUpdate extends UIPurchaseDetail {
  id_detalle_compra?: number | null;
}

// Union type para manejar ambos casos
type PurchaseDetailUnion = UIPurchaseDetail | UIPurchaseDetailUpdate;

// ==================== CONSTANTES ====================
const DEFAULT_INC_P_VENTA = 0; // 0%
const DEFAULT_INC_P_VENTA_ALT = 15; // 15%
// const DEFAULT_MONEDA = "BOB";

// ==================== HOOK ====================
/**
 * Hook para manejar detalles de compra con cálculos precisos
 * @param isEditMode - Si está en modo edición (incluye id_detalle_compra)
 * @param exchangeRate - Tipo de cambio actual
 */
export const usePurchaseDetails = <
  T extends PurchaseDetailUnion = UIPurchaseDetail,
>(
  isEditMode: boolean = false,
  exchangeRate: number = 6.96,
) => {
  const [details, setDetails] = useState<T[]>([]);

  useEffect(() => {
    setDetails((prev) =>
      prev.map((d) => ({
        ...d,
        tc_compra: roundTo5Decimals(exchangeRate),
      })),
    );
  }, [exchangeRate]);

  // ==================== FUNCIONES DE CÁLCULO ====================
  /**
   * Calcular precio desde costo e incremento
   */
  const calcularPrecioDesdeIncremento = (
    costo: number,
    incremento: number,
  ): number => {
    const porcentajeTotal = addPrecise(100, incremento);
    return multiplyPrecise(costo, dividePrecise(porcentajeTotal, 100));
  };

  /**
   * Calcular incremento desde precios base y final
   */
  const calcularIncrementoDesdePrecios = (
    base: number,
    precio: number,
  ): number => {
    if (base === 0) return 0;
    const diferencia = subtractPrecise(precio, base);
    return calculatePercent(diferencia, base);
  };

  // ==================== AÑADIR PRODUCTO ÚNICO ====================
  /**
   * Agregar un solo producto a la lista de detalles
   * Si ya existe, incrementa la cantidad en 1
   */
  const addProduct = useCallback(
    (product: ProductGet, customQuantity?: number) => {
      setDetails((prev) => {
        // Verificar si el producto ya existe
        const existingIndex = prev.findIndex(
          (d) => d.id_producto === product.id,
        );

        // Si existe, solo incrementar cantidad
        if (existingIndex !== -1) {
          return prev.map((d, idx) =>
            idx === existingIndex
              ? { ...d, cantidad: d.cantidad + (customQuantity || 1) }
              : d,
          );
        }

        // Crear nuevo detalle con cálculos precisos
        const costo = roundTo5Decimals(product.costo_referencia || 0);
        const precio_venta = calcularPrecioDesdeIncremento(
          costo,
          DEFAULT_INC_P_VENTA,
        );
        const precio_venta_alt = calcularPrecioDesdeIncremento(
          precio_venta,
          DEFAULT_INC_P_VENTA_ALT,
        );

        const newDetail: any = {
          id_producto: product.id,
          cantidad: customQuantity || 1,
          costo,
          inc_p_venta: DEFAULT_INC_P_VENTA,
          precio_venta,
          inc_p_venta_alt: DEFAULT_INC_P_VENTA_ALT,
          precio_venta_alt,
          tc_compra: roundTo5Decimals(exchangeRate),
          //   moneda: DEFAULT_MONEDA,
          orden: prev.length + 1,
          product: {
            id: product.id,
            descripcion: product.descripcion,
            codigo_oem: product.codigo_oem,
            codigo_interno: product.codigo_interno,
            codigo_upc: product.codigo_upc,
            marca: product.marca,
            categoria: product.categoria,
            procedencia: product.procedencia,
          },
        };

        // Si estamos en modo edición, agregar campo id_detalle_compra como null
        if (isEditMode) {
          newDetail.id_detalle_compra = null;
        }

        return [...prev, newDetail as T];
      });
    },
    [isEditMode, exchangeRate],
  );

  // ==================== AÑADIR MÚLTIPLES PRODUCTOS ====================
  /**
   * Agregar múltiples productos a la vez
   * Retorna los IDs de productos que fueron realmente agregados (no duplicados)
   */
  const addMultipleProducts = useCallback(
    (products: Array<ProductGet & { quantity?: number }>): number[] => {
      const addedProductIds: number[] = [];

      setDetails((prev) => {
        let newDetails = [...prev];

        products.forEach((product) => {
          const existingIndex = newDetails.findIndex(
            (d) => d.id_producto === product.id,
          );

          if (existingIndex !== -1) {
            // Producto existe, incrementar cantidad
            newDetails = newDetails.map((d, idx) =>
              idx === existingIndex
                ? { ...d, cantidad: d.cantidad + (product.quantity ?? 1) }
                : d,
            );
          } else {
            // Producto nuevo, calcular valores
            const costo = roundTo5Decimals(product.costo_referencia || 0);
            const precio_venta = calcularPrecioDesdeIncremento(
              costo,
              DEFAULT_INC_P_VENTA,
            );
            const precio_venta_alt = calcularPrecioDesdeIncremento(
              precio_venta,
              DEFAULT_INC_P_VENTA_ALT,
            );

            const newDetail: any = {
              id_producto: product.id,
              cantidad: product.quantity ?? 1,
              costo,
              inc_p_venta: DEFAULT_INC_P_VENTA,
              precio_venta,
              inc_p_venta_alt: DEFAULT_INC_P_VENTA_ALT,
              precio_venta_alt,
              tc_compra: roundTo5Decimals(exchangeRate),
              //   moneda: DEFAULT_MONEDA,
              orden: newDetails.length + 1,
              product: {
                id: product.id,
                descripcion: product.descripcion,
                codigo_oem: product.codigo_oem,
                codigo_interno: product.codigo_interno,
                codigo_upc: product.codigo_upc,
                marca: product.marca,
                categoria: product.categoria,
                procedencia: product.procedencia,
              },
            };

            if (isEditMode) {
              newDetail.id_detalle_compra = null;
            }

            newDetails.push(newDetail as T);
            addedProductIds.push(product.id);
          }
        });

        // Reordenar índices
        return newDetails.map((d, index) => ({ ...d, orden: index + 1 }));
      });

      return addedProductIds;
    },
    [isEditMode, exchangeRate],
  );

  // ==================== ELIMINAR PRODUCTO ====================
  /**
   * Eliminar un producto de la lista
   * Reordena automáticamente los índices
   */
  const removeProduct = useCallback((id_producto: number) => {
    setDetails((prev) => {
      const filtered = prev.filter((d) => d.id_producto !== id_producto);
      return filtered.map((d, index) => ({ ...d, orden: index + 1 }));
    });
  }, []);

  // ==================== ACTUALIZAR CANTIDAD ====================
  /**
   * Actualizar la cantidad de un producto
   */
  const updateCantidad = useCallback(
    (id_producto: number, cantidad: number) => {
      const cantidadNum = Number(cantidad);
      if (cantidadNum <= 0 || isNaN(cantidadNum)) return;

      setDetails((prev) =>
        prev.map((d) =>
          d.id_producto === id_producto ? { ...d, cantidad: cantidadNum } : d,
        ),
      );
    },
    [],
  );

  // ==================== ACTUALIZAR COSTO ====================
  /**
   * Actualizar el costo de un producto
   * Recalcula automáticamente precio_venta y precio_venta_alt
   */
  const updateCosto = useCallback((id_producto: number, costo: number) => {
    const costoNum = Number(costo);
    if (isNaN(costoNum)) return;

    setDetails((prev) =>
      prev.map((d) => {
        if (d.id_producto !== id_producto) return d;

        const precio_venta = calcularPrecioDesdeIncremento(
          costoNum,
          d.inc_p_venta,
        );
        const precio_venta_alt = calcularPrecioDesdeIncremento(
          precio_venta,
          d.inc_p_venta_alt,
        );

        return {
          ...d,
          costo: costoNum,
          precio_venta,
          precio_venta_alt,
        };
      }),
    );
  }, []);

  // ==================== ACTUALIZAR INC PRECIO VENTA ====================
  /**
   * Actualizar el incremento de precio de venta
   * Recalcula precio_venta y precio_venta_alt
   */
  const updateIncPVenta = useCallback(
    (id_producto: number, inc_p_venta: number) => {
      const incNum = Number(inc_p_venta);
      if (isNaN(incNum)) return;

      setDetails((prev) =>
        prev.map((d) => {
          if (d.id_producto !== id_producto) return d;

          const precio_venta = calcularPrecioDesdeIncremento(d.costo, incNum);
          const precio_venta_alt = calcularPrecioDesdeIncremento(
            precio_venta,
            d.inc_p_venta_alt,
          );

          return {
            ...d,
            inc_p_venta: incNum,
            precio_venta,
            precio_venta_alt,
          };
        }),
      );
    },
    [],
  );

  // ==================== ACTUALIZAR PRECIO VENTA ====================
  /**
   * Actualizar el precio de venta directamente
   * Recalcula inc_p_venta y precio_venta_alt
   */
  const updatePrecioVenta = useCallback(
    (id_producto: number, precio_venta: number) => {
      const precioNum = Number(precio_venta);
      if (isNaN(precioNum)) return;

      setDetails((prev) =>
        prev.map((d) => {
          if (d.id_producto !== id_producto) return d;

          const inc_p_venta = calcularIncrementoDesdePrecios(
            d.costo,
            precioNum,
          );
          const precio_venta_alt = calcularPrecioDesdeIncremento(
            precioNum,
            d.inc_p_venta_alt,
          );

          return {
            ...d,
            inc_p_venta,
            precio_venta: precioNum,
            precio_venta_alt,
          };
        }),
      );
    },
    [],
  );

  // ==================== ACTUALIZAR INC PRECIO VENTA ALT ====================
  /**
   * Actualizar el incremento alternativo
   * Recalcula precio_venta_alt
   */
  const updateIncPVentaAlt = useCallback(
    (id_producto: number, inc_p_venta_alt: number) => {
      const incAltNum = Number(inc_p_venta_alt);
      if (isNaN(incAltNum)) return;

      setDetails((prev) =>
        prev.map((d) => {
          if (d.id_producto !== id_producto) return d;

          const precio_venta_alt = calcularPrecioDesdeIncremento(
            d.precio_venta,
            incAltNum,
          );

          return {
            ...d,
            inc_p_venta_alt: incAltNum,
            precio_venta_alt,
          };
        }),
      );
    },
    [],
  );

  // ==================== ACTUALIZAR PRECIO VENTA ALT ====================
  /**
   * Actualizar el precio de venta alternativo
   * Recalcula inc_p_venta_alt
   */
  const updatePrecioVentaAlt = useCallback(
    (id_producto: number, precio_venta_alt: number) => {
      const precioAltNum = Number(precio_venta_alt);
      if (isNaN(precioAltNum)) return;

      setDetails((prev) =>
        prev.map((d) => {
          if (d.id_producto !== id_producto) return d;

          const inc_p_venta_alt = calcularIncrementoDesdePrecios(
            d.precio_venta,
            precioAltNum,
          );

          return {
            ...d,
            inc_p_venta_alt,
            precio_venta_alt: precioAltNum,
          };
        }),
      );
    },
    [],
  );

  // ==================== CARGAR DESDE PEDIDO ====================
  /**
   * Cargar detalles desde un pedido existente
   */
  const loadFromOrder = useCallback(
    (orderDetails: any[], orderProducts?: any[]) => {
      const mappedDetails = orderDetails.map((detalle: any, index: number) => {
        // Buscar el producto completo si existe
        const product =
          orderProducts?.find((p) => p.id === detalle.producto?.id) ||
          detalle.producto;

        const cantidad = parseInt(detalle.cantidad) || 1;
        const costo = roundTo5Decimals(parseFloat(detalle.costo || "0") || 0);
        const inc_p_venta = DEFAULT_INC_P_VENTA;
        const inc_p_venta_alt = DEFAULT_INC_P_VENTA_ALT;

        const precio_venta = calcularPrecioDesdeIncremento(costo, inc_p_venta);
        const precio_venta_alt = calcularPrecioDesdeIncremento(
          precio_venta,
          inc_p_venta_alt,
        );

        const newDetail: any = {
          id_producto: product.id,
          cantidad,
          costo,
          inc_p_venta,
          precio_venta,
          inc_p_venta_alt,
          precio_venta_alt,
          tc_compra: roundTo5Decimals(exchangeRate),
          //   moneda: DEFAULT_MONEDA,
          orden: index + 1,
          product: {
            id: product.id,
            descripcion: product.descripcion,
            codigo_oem: product.codigo_oem,
            codigo_interno: product.codigo_interno,
            codigo_upc: product.codigo_upc,
            marca: product.marca,
            categoria: product.categoria,
          },
        };

        if (isEditMode) {
          newDetail.id_detalle_compra = null;
        }

        return newDetail as T;
      });

      setDetails(mappedDetails);
    },
    [isEditMode, exchangeRate],
  );

  // ==================== OBTENER TOTALES ====================
  /**
   * Calcular total de costo
   */
  const getTotalCosto = useCallback((): number => {
    return details.reduce((sum, detail) => {
      const itemTotal = multiplyPrecise(detail.cantidad, detail.costo);
      return addPrecise(sum, itemTotal);
    }, 0);
  }, [details]);

  /**
   * Calcular total de precio de venta
   */
  const getTotalPrecioVenta = useCallback((): number => {
    return details.reduce((sum, detail) => {
      const itemTotal = multiplyPrecise(detail.cantidad, detail.precio_venta);
      return addPrecise(sum, itemTotal);
    }, 0);
  }, [details]);

  /**
   * Calcular total de precio de venta alternativo
   */
  const getTotalPrecioVentaAlt = useCallback((): number => {
    return details.reduce((sum, detail) => {
      const itemTotal = multiplyPrecise(
        detail.cantidad,
        detail.precio_venta_alt,
      );
      return addPrecise(sum, itemTotal);
    }, 0);
  }, [details]);

  // ==================== PREPARAR PARA BACKEND ====================
  /**
   * Obtener detalles sin información del producto (para enviar al backend)
   * Normaliza todos los valores a 5 decimales
   */
  const getDetailsForBackend = useCallback((): T extends UIPurchaseDetailUpdate
    ? PurchaseDetailUpdate[]
    : PurchaseDetailCreate[] => {
    return details.map(({ product, ...detail }) => ({
      ...detail,
      id_producto: Number(detail.id_producto),
      cantidad: Number(detail.cantidad),
      costo: roundTo5Decimals(Number(detail.costo)),
      inc_p_venta: roundTo5Decimals(Number(detail.inc_p_venta)),
      precio_venta: roundTo5Decimals(Number(detail.precio_venta)),
      inc_p_venta_alt: roundTo5Decimals(Number(detail.inc_p_venta_alt)),
      precio_venta_alt: roundTo5Decimals(Number(detail.precio_venta_alt)),
      tc_compra: roundTo5Decimals(Number(detail.tc_compra)),
    })) as any;
  }, [details]);

  // ==================== LIMPIAR DETALLES ====================
  /**
   * Limpiar todos los detalles
   */
  const clearDetails = useCallback(() => {
    setDetails([]);
  }, []);

  // ==================== ESTABLECER DETALLES ====================
  /**
   * Establecer detalles completos (útil para modo edición)
   * Normaliza todos los valores
   */
  const setDetailsComplete = useCallback((newDetails: T[]) => {
    const normalizedDetails = newDetails.map((detail) => ({
      ...detail,
      costo: roundTo5Decimals(detail.costo),
      inc_p_venta: roundTo5Decimals(detail.inc_p_venta),
      precio_venta: roundTo5Decimals(detail.precio_venta),
      inc_p_venta_alt: roundTo5Decimals(detail.inc_p_venta_alt),
      precio_venta_alt: roundTo5Decimals(detail.precio_venta_alt),
      tc_compra: roundTo5Decimals(detail.tc_compra),
    }));
    setDetails(normalizedDetails);
  }, []);

  // ==================== RETORNO DEL HOOK ====================
  return {
    // Estado
    details,

    // Operaciones de productos
    addProduct,
    addMultipleProducts,
    removeProduct,

    // Actualizaciones de campos
    updateCantidad,
    updateCosto,
    updateIncPVenta,
    updatePrecioVenta,
    updateIncPVentaAlt,
    updatePrecioVentaAlt,

    // Operaciones especiales
    loadFromOrder,
    clearDetails,
    setDetailsComplete,

    // Cálculos
    getTotalCosto,
    getTotalPrecioVenta,
    getTotalPrecioVentaAlt,

    // Para backend
    getDetailsForBackend,
  };
};
