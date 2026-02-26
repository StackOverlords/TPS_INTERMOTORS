import { useState, useCallback } from "react";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import type {
  OrderDetailCreate,
  UIOrderDetailCreate,
} from "../types/orderCreate.types";
import type {
  OrderDetailUpdate,
  UIOrderDetailUpdate,
} from "../types/orderUpdate.types";
import {
  multiplyPrecise,
  dividePrecise,
  addPrecise,
  subtractPrecise,
  roundTo5Decimals,
  calculatePercent,
} from "@/utils/decimalUtils";

const DEFAULT_INC_P_VENTA = 0; // 30%
const DEFAULT_INC_P_VENTA_ALT = 16; // 15%

type OrderDetailUnion = UIOrderDetailCreate | UIOrderDetailUpdate;

export const useOrderDetails = <
  T extends OrderDetailUnion = UIOrderDetailCreate,
>(
  isEditMode: boolean = false,
  exchangeRate: number = 6.96,
) => {
  const [details, setDetails] = useState<T[]>([]);

  // Calcular precio desde incremento con precisión
  const calcularPrecioDesdeIncremento = (
    costo: number,
    incremento: number,
  ): number => {
    const porcentajeTotal = addPrecise(100, incremento);
    return multiplyPrecise(costo, dividePrecise(porcentajeTotal, 100));
  };

  // Calcular incremento desde precios con precisión
  const calcularIncrementoDesdePrecios = (
    base: number,
    precio: number,
  ): number => {
    if (base === 0) return 0;
    const diferencia = subtractPrecise(precio, base);
    return calculatePercent(diferencia, base);
  };

  // ==================== AÑADIR PRODUCTO ====================
  const addProduct = useCallback(
    (product: ProductGet) => {
      setDetails((prev) => {
        const exists = prev.find((d) => d.id_producto === product.id);
        if (exists) {
          return prev.map((d) =>
            d.id_producto === product.id
              ? { ...d, cantidad: d.cantidad + 1 }
              : d,
          );
        }

        // Calcular precios con funciones precisas
        const costo = roundTo5Decimals(product.precio_venta || 0);
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
          cantidad: 1,
          costo,
          inc_p_venta: DEFAULT_INC_P_VENTA,
          precio_venta,
          inc_p_venta_alt: DEFAULT_INC_P_VENTA_ALT,
          precio_venta_alt,
          orden: prev.length + 1,
          tc_compra: exchangeRate,
          product: {
            id: product.id,
            codigo_interno: product.codigo_interno,
            descripcion: product.descripcion,
            codigo_oem: product.codigo_oem,
            codigo_upc: product.codigo_upc,
            precio_venta: product.precio_venta,
            marca: product.marca,
            procedencia: product.procedencia,
          },
        };

        if (isEditMode) {
          newDetail.id_detalle_pedido = null;
        }

        return [...prev, newDetail as T];
      });
    },
    [isEditMode, exchangeRate],
  );

  // ==================== AÑADIR MÚLTIPLES PRODUCTOS ====================
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
            newDetails = newDetails.map((d, idx) =>
              idx === existingIndex
                ? { ...d, cantidad: d.cantidad + (product.quantity ?? 1) }
                : d,
            );
          } else {
            // Calcular precios con funciones precisas
            const costo = roundTo5Decimals(product.precio_venta || 0);
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
              cantidad: product.quantity,
              costo,
              inc_p_venta: DEFAULT_INC_P_VENTA,
              precio_venta,
              inc_p_venta_alt: DEFAULT_INC_P_VENTA_ALT,
              precio_venta_alt,
              orden: newDetails.length,
              tc_compra: exchangeRate,
              product: {
                id: product.id,
                codigo_interno: product.codigo_interno,
                descripcion: product.descripcion,
                codigo_oem: product.codigo_oem,
                codigo_upc: product.codigo_upc,
                precio_venta: product.precio_venta,
                marca: product.marca,
                procedencia: product.procedencia,
              },
            };

            if (isEditMode) {
              newDetail.id_detalle_pedido = null;
            }

            newDetails.push(newDetail as T);
            addedProductIds.push(product.id);
          }
        });

        return newDetails.map((d, index) => ({ ...d, orden: index + 1 }));
      });

      return addedProductIds;
    },
    [isEditMode, exchangeRate],
  );

  // ==================== ELIMINAR PRODUCTO ====================
  const removeProduct = useCallback((id_producto: number) => {
    setDetails((prev) => {
      const filtered = prev.filter((d) => d.id_producto !== id_producto);
      return filtered.map((d, index) => ({ ...d, orden: index + 1 }));
    });
  }, []);

  // ==================== ACTUALIZAR CANTIDAD ====================
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
  const updateCosto = useCallback((id_producto: number, costo: number) => {
    const costoNum = Number(costo);
    if (isNaN(costoNum)) return;

    setDetails((prev) =>
      prev.map((d) => {
        if (d.id_producto !== id_producto) return d;

        // Recalcular con funciones precisas
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

  // ==================== ACTUALIZAR INCREMENTO PRECIO VENTA ====================
  const updateIncPVenta = useCallback(
    (id_producto: number, inc_p_venta: number) => {
      const incNum = Number(inc_p_venta);
      if (isNaN(incNum)) return;

      setDetails((prev) =>
        prev.map((d) => {
          if (d.id_producto !== id_producto) return d;

          // Recalcular con funciones precisas
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
  const updatePrecioVenta = useCallback(
    (id_producto: number, precio_venta: number) => {
      const precioNum = Number(precio_venta);
      if (isNaN(precioNum)) return;

      setDetails((prev) =>
        prev.map((d) => {
          if (d.id_producto !== id_producto) return d;

          // Recalcular con funciones precisas
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

  // ==================== ACTUALIZAR INCREMENTO ALTERNATIVO ====================
  const updateIncPVentaAlt = useCallback(
    (id_producto: number, inc_p_venta_alt: number) => {
      const incAltNum = Number(inc_p_venta_alt);
      if (isNaN(incAltNum)) return;

      setDetails((prev) =>
        prev.map((d) => {
          if (d.id_producto !== id_producto) return d;

          // Recalcular con funciones precisas
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

  // ==================== ACTUALIZAR PRECIO VENTA ALTERNATIVO ====================
  const updatePrecioVentaAlt = useCallback(
    (id_producto: number, precio_venta_alt: number) => {
      const precioAltNum = Number(precio_venta_alt);
      if (isNaN(precioAltNum)) return;

      setDetails((prev) =>
        prev.map((d) => {
          if (d.id_producto !== id_producto) return d;

          // Recalcular con funciones precisas
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

  // ==================== OBTENER TOTAL COSTO ====================
  const getTotalCosto = useCallback((): number => {
    return details.reduce((sum, detail) => {
      // Usar funciones precisas
      const itemTotal = multiplyPrecise(detail.cantidad, detail.costo);
      return addPrecise(sum, itemTotal);
    }, 0);
  }, [details]);

  // ==================== OBTENER TOTAL ALTERNATIVO ====================
  const getTotalAlt = useCallback((): number => {
    return details.reduce((sum, detail) => {
      // Usar funciones precisas
      const itemTotal = multiplyPrecise(
        detail.cantidad,
        detail.precio_venta_alt,
      );
      return addPrecise(sum, itemTotal);
    }, 0);
  }, [details]);

  // ==================== OBTENER DETALLES PARA ENVÍO ====================
  const getOrderDetails = useCallback((): T extends UIOrderDetailUpdate
    ? OrderDetailUpdate[]
    : OrderDetailCreate[] => {
    return details.map(({ product, ...detail }) => ({
      ...detail,
      // Redondear todos los valores a 5 decimales antes de enviar
      id_producto: Number(detail.id_producto),
      cantidad: Number(detail.cantidad),
      costo: roundTo5Decimals(Number(detail.costo)),
      inc_p_venta: roundTo5Decimals(Number(detail.inc_p_venta)),
      precio_venta: roundTo5Decimals(Number(detail.precio_venta)),
      inc_p_venta_alt: roundTo5Decimals(Number(detail.inc_p_venta_alt)),
      precio_venta_alt: roundTo5Decimals(Number(detail.precio_venta_alt)),
      orden: Number(detail.orden),
      tc_compra:
        detail.tc_compra !== null && detail.tc_compra !== undefined
          ? roundTo5Decimals(Number(detail.tc_compra))
          : null,
    })) as any;
  }, [details]);

  // ==================== LIMPIAR DETALLES ====================
  const clearDetails = useCallback(() => {
    setDetails([]);
  }, []);

  // ==================== ESTABLECER DETALLES ====================
  const setOrderDetails = useCallback((newDetails: T[]) => {
    // Normalizar valores al establecer
    const normalizedDetails = newDetails.map((detail) => ({
      ...detail,
      costo: roundTo5Decimals(detail.costo),
      inc_p_venta: roundTo5Decimals(detail.inc_p_venta),
      precio_venta: roundTo5Decimals(detail.precio_venta),
      inc_p_venta_alt: roundTo5Decimals(detail.inc_p_venta_alt),
      precio_venta_alt: roundTo5Decimals(detail.precio_venta_alt),
      tc_compra: detail.tc_compra
        ? roundTo5Decimals(detail.tc_compra)
        : detail.tc_compra,
    }));
    setDetails(normalizedDetails);
  }, []);

  return {
    details,
    addProduct,
    addMultipleProducts,
    removeProduct,
    updateCantidad,
    updateCosto,
    updateIncPVenta,
    updatePrecioVenta,
    updateIncPVentaAlt,
    updatePrecioVentaAlt,
    getOrderDetails,
    clearDetails,
    setOrderDetails,
    getTotalCosto,
    getTotalAlt,
  };
};
