import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import type { QuotationUpdateDetail } from "@/modules/quotations/types/quotationUpdate.types";
import { useState, useCallback, useEffect } from "react";
import {
  multiplyPrecise,
  dividePrecise,
  calculateAmountFromPercent,
  calculatePercent,
  subtractPrecise,
  isGreaterThanZero,
  addPrecise,
  roundTo5Decimals,
} from "@/utils/decimalUtils";

export type DiscountType = "percentage" | "amount";

export interface QuotationUpdateDetailUI extends QuotationUpdateDetail {
  codigo_oem?: string;
}

interface UseSaleProductDetailsReturn {
  discountType: DiscountType;
  globalDiscount: number;
  details: QuotationUpdateDetailUI[];
  addProduct: (product: ProductGet | ProductGet[]) => void;
  addMultipleItemsWithQuantity: (
    products: Array<ProductGet & { quantity?: number }>
  ) => void;
  removeProduct: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updatePrice: (productId: number, price: number) => void;
  updateDescription: (productId: number, description: string) => void;
  updateBrand: (productId: number, brand: string) => void;
  applyGlobalDiscount: (discount: number, type: DiscountType) => void;
  clearGlobalDiscount: () => void;
  updateCustomSubtotal: (productId: number, customSubtotal: number) => void;
  calculateSubtotal: (detail: QuotationUpdateDetailUI) => number;
  calculateTotal: () => number;
  calculateTotalDiscount: () => number;
  getDiscountPercentage: () => number;
  calculateTotalBeforeDiscount: () => number;
  initializeDetails: (details: QuotationUpdateDetailUI[]) => void;
  getCleanDetailsForSubmit: () => QuotationUpdateDetail[];
  setDiscountType: (type: DiscountType) => void;
  setGlobalDiscount: (discount: number) => void;
}

const useQuotationProductDetails = (): UseSaleProductDetailsReturn => {
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [hasDiscount, setHasDiscount] = useState<boolean>(false);
  const [details, setDetails] = useState<QuotationUpdateDetailUI[]>([]);

  const calculateItemDiscount = useCallback(
    (precio: number, cantidad: number, porcentajeDescuento: number): number => {
      const subtotal = multiplyPrecise(precio, cantidad);
      return calculateAmountFromPercent(porcentajeDescuento, subtotal);
    },
    []
  );

  useEffect(() => {
    if (details.length <= 0) return;
    const existingDiscount = details.find((p) =>
      isGreaterThanZero(p.descuento)
    );
    if (existingDiscount) {
      setHasDiscount(true);
    }
  }, [details]);

  // Inicializar detalles con normalización
  const initializeDetails = useCallback(
    (initialDetails: QuotationUpdateDetailUI[]) => {
      const normalizedDetails = initialDetails.map((detail) => ({
        ...detail,
        precio: roundTo5Decimals(detail.precio),
        descuento: roundTo5Decimals(detail.descuento),
        porcentaje_descuento: roundTo5Decimals(detail.porcentaje_descuento),
      }));
      setDetails(normalizedDetails);
    },
    []
  );

  const getCleanDetailsForSubmit = useCallback((): QuotationUpdateDetail[] => {
    return details.map((detail) => {
      const { codigo_oem, ...cleanDetail } = detail;
      return cleanDetail;
    });
  }, [details]);

  // ==================== AGREGAR PRODUCTO(S) ====================
  const addProduct = useCallback(
    (input: ProductGet | ProductGet[]) => {
      setDetails((prevDetails) => {
        const productsToAdd = Array.isArray(input) ? input : [input];
        const updated = [...prevDetails];
        let addedCount = 0;

        const productWithDiscount = prevDetails.find(
          (p) =>
            isGreaterThanZero(p.descuento) &&
            isGreaterThanZero(p.porcentaje_descuento)
        );
        const existingDiscountPercentage =
          productWithDiscount?.porcentaje_descuento ?? 0;

        productsToAdd.forEach((product) => {
          const existingIndex = updated.findIndex(
            (d) => d.id_producto === product.id
          );

          if (existingIndex !== -1) {
            const item = updated[existingIndex];
            const newQuantity = item.cantidad + 1;
            const newDiscount = calculateItemDiscount(
              item.precio,
              newQuantity,
              item.porcentaje_descuento
            );

            updated[existingIndex] = {
              ...updated[existingIndex],
              cantidad: newQuantity,
              descuento: newDiscount,
            };
            addedCount++;
          } else {
            let porcentaje_descuento = 0;
            let descuento = 0;

            if (hasDiscount && isGreaterThanZero(existingDiscountPercentage)) {
              porcentaje_descuento = existingDiscountPercentage;
              descuento = calculateItemDiscount(
                product.precio_venta,
                1,
                existingDiscountPercentage
              );
            }

            const composedDescription = [product.categoria, product.medida]
              .filter((v): v is string => Boolean(v && v.trim()))
              .join(" ");

            const newDetail: QuotationUpdateDetailUI = {
              id_producto: product.id,
              cantidad: 1,
              descuento: descuento,
              porcentaje_descuento: porcentaje_descuento,
              id_detalle_cotizacion: null,
              precio: product.precio_venta,
              descripcion: composedDescription || product.descripcion,
              nueva_marca: product.marca,
              orden: updated.length + 1,
              codigo_oem: product.codigo_oem ?? "",
            };

            updated.push(newDetail);
            addedCount++;
          }
        });

        if (addedCount > 0) {
          const message = Array.isArray(input)
            ? `${addedCount} producto(s) agregados correctamente`
            : `${productsToAdd[0].descripcion} agregado correctamente`;

          showSuccessToast({
            title: Array.isArray(input)
              ? "Productos agregados"
              : "Producto agregado",
            description: message,
            duration: 2000,
          });
        }

        return updated.map((product, index) => ({
          ...product,
          orden: index + 1,
        }));
      });
    },
    [hasDiscount, calculateItemDiscount]
  );

  // ==================== AGREGAR MÚLTIPLES CON CANTIDAD ====================
  const addMultipleItemsWithQuantity = useCallback(
    (productsToAdd: Array<ProductGet & { quantity?: number }>) => {
      setDetails((prevDetails) => {
        const updated = [...prevDetails];
        let addedCount = 0;

        const productWithDiscount = prevDetails.find(
          (p) =>
            isGreaterThanZero(p.descuento) &&
            isGreaterThanZero(p.porcentaje_descuento)
        );
        const existingDiscountPercentage =
          productWithDiscount?.porcentaje_descuento ?? 0;

        productsToAdd.forEach((product) => {
          const quantity = product.quantity || 1;
          const existingIndex = updated.findIndex(
            (d) => d.id_producto === product.id
          );

          if (existingIndex !== -1) {
            const item = updated[existingIndex];
            const newQuantity = item.cantidad + quantity;
            const newDiscount = calculateItemDiscount(
              item.precio,
              newQuantity,
              item.porcentaje_descuento
            );

            updated[existingIndex] = {
              ...updated[existingIndex],
              cantidad: newQuantity,
              descuento: newDiscount,
            };
            addedCount++;
          } else {
            let porcentaje_descuento = 0;
            let descuento = 0;

            if (hasDiscount && isGreaterThanZero(existingDiscountPercentage)) {
              porcentaje_descuento = existingDiscountPercentage;
              descuento = calculateItemDiscount(
                product.precio_venta,
                quantity,
                existingDiscountPercentage
              );
            }

            const composedDescription = [product.categoria, product.medida]
              .filter((v): v is string => Boolean(v && v.trim()))
              .join(" ");

            const newDetail: QuotationUpdateDetailUI = {
              id_producto: product.id,
              cantidad: quantity,
              descuento: descuento,
              porcentaje_descuento: porcentaje_descuento,
              id_detalle_cotizacion: null,
              precio: product.precio_venta,
              descripcion: composedDescription || product.descripcion,
              nueva_marca: product.marca,
              orden: updated.length + 1,
              codigo_oem: product.codigo_oem ?? "",
            };

            updated.push(newDetail);
            addedCount++;
          }
        });

        if (addedCount > 0) {
          showSuccessToast({
            title: "Productos agregados",
            description: `${addedCount} producto(s) agregados correctamente`,
            duration: 2000,
          });
        }

        return updated.map((product, index) => ({
          ...product,
          orden: index + 1,
        }));
      });
    },
    [hasDiscount, calculateItemDiscount]
  );

  // ==================== QUITAR PRODUCTO ====================
  const removeProduct = useCallback((productId: number) => {
    setDetails((prevDetails) => {
      // if (prevDetails.length <= 1) {
      //   showErrorToast({
      //     title: "No se puede eliminar",
      //     description: "Debe haber al menos un producto en la cotización",
      //     duration: 2000,
      //   });
      //   return prevDetails;
      // }

      const updated = prevDetails.filter(
        (detail) => detail.id_producto !== productId
      );
      return updated.map((product, index) => ({
        ...product,
        orden: index + 1,
      }));
    });
  }, []);

  // ==================== ACTUALIZAR CANTIDAD ====================
  const updateQuantity = useCallback(
    (productId: number, quantity: number) => {
      if (quantity < 1) {
        showErrorToast({
          title: "Cantidad inválida",
          description: "La cantidad debe ser mayor a 0",
          duration: 2000,
        });
        return;
      }

      setDetails((prevDetails) =>
        prevDetails.map((detail) => {
          if (detail.id_producto === productId) {
            let newDiscount = detail.descuento;
            if (isGreaterThanZero(detail.porcentaje_descuento)) {
              newDiscount = calculateItemDiscount(
                detail.precio,
                quantity,
                detail.porcentaje_descuento
              );
            }

            return {
              ...detail,
              cantidad: quantity,
              descuento: newDiscount,
            };
          }
          return detail;
        })
      );
    },
    [calculateItemDiscount]
  );

  // ==================== ACTUALIZAR SUBTOTAL PERSONALIZADO ====================
  const updateCustomSubtotal = useCallback(
    (productId: number, customSubtotal: number) => {
      if (!isGreaterThanZero(customSubtotal)) {
        showErrorToast({
          title: "Monto inválido",
          description: "El monto debe ser mayor a 0",
          duration: 2000,
        });
        return;
      }

      setDetails((prevDetails) =>
        prevDetails.map((detail) => {
          if (detail.id_producto === productId) {
            const newPrice = dividePrecise(customSubtotal, detail.cantidad);
            let newDiscount = 0;

            if (isGreaterThanZero(detail.porcentaje_descuento)) {
              newDiscount = calculateAmountFromPercent(
                detail.porcentaje_descuento,
                customSubtotal
              );
            }

            return {
              ...detail,
              precio: newPrice,
              descuento: newDiscount,
            };
          }
          return detail;
        })
      );
    },
    []
  );

  // ==================== ACTUALIZAR PRECIO ====================
  const updatePrice = useCallback(
    (productId: number, price: number) => {
      if (price < 0) {
        showErrorToast({
          title: "Precio inválido",
          description: "El precio no puede ser negativo",
          duration: 2000,
        });
        return;
      }

      setDetails((prevDetails) =>
        prevDetails.map((detail) => {
          if (detail.id_producto === productId) {
            let newDiscount = detail.descuento;
            if (isGreaterThanZero(detail.porcentaje_descuento)) {
              newDiscount = calculateItemDiscount(
                price,
                detail.cantidad,
                detail.porcentaje_descuento
              );
            }

            return {
              ...detail,
              precio: price,
              descuento: newDiscount,
            };
          }
          return detail;
        })
      );
    },
    [calculateItemDiscount]
  );

  const updateDescription = useCallback(
    (productId: number, description: string) => {
      setDetails((prevDetails) =>
        prevDetails.map((d) => {
          if (d.id_producto === productId) {
            return { ...d, descripcion: description };
          }
          return d;
        })
      );
    },
    []
  );

  const updateBrand = useCallback((productId: number, brand: string) => {
    setDetails((prevDetails) =>
      prevDetails.map((d) => {
        if (d.id_producto === productId) {
          return { ...d, nueva_marca: brand };
        }
        return d;
      })
    );
  }, []);

  // ==================== APLICAR DESCUENTO GLOBAL ====================
  const applyGlobalDiscount = useCallback(
    (discount: number, type: DiscountType) => {
      if (discount < 0) {
        showErrorToast({
          title: "Descuento inválido",
          description: "El descuento no puede ser negativo",
          duration: 2000,
        });
        return;
      }

      setDetails((prevDetails) => {
        if (prevDetails.length === 0) {
          showErrorToast({
            title: "Sin productos",
            description: "No hay productos para aplicar descuento",
            duration: 2000,
          });
          return prevDetails;
        }

        let updated: QuotationUpdateDetailUI[];

        if (type === "percentage") {
          if (discount > 100) {
            showErrorToast({
              title: "Descuento inválido",
              description: "El descuento porcentual no puede ser mayor a 100%",
              duration: 2000,
            });
            return prevDetails;
          }

          updated = prevDetails.map((detail) => {
            const discountAmount = calculateItemDiscount(
              detail.precio,
              detail.cantidad,
              discount
            );

            return {
              ...detail,
              porcentaje_descuento: discount,
              descuento: discountAmount,
            };
          });
        } else {
          const totalWithoutDiscount = prevDetails.reduce((acc, detail) => {
            return addPrecise(
              acc,
              multiplyPrecise(detail.cantidad, detail.precio)
            );
          }, 0);

          if (discount > totalWithoutDiscount) {
            showErrorToast({
              title: "Descuento inválido",
              description:
                "El descuento no puede ser mayor al total de la cotización",
              duration: 2000,
            });
            return prevDetails;
          }

          const discountPercentage = calculatePercent(
            discount,
            totalWithoutDiscount
          );

          updated = prevDetails.map((detail) => {
            const discountAmount = calculateItemDiscount(
              detail.precio,
              detail.cantidad,
              discountPercentage
            );

            return {
              ...detail,
              porcentaje_descuento: discountPercentage,
              descuento: discountAmount,
            };
          });
        }

        setDiscountType(type);
        setGlobalDiscount(discount);
        return updated;
      });
    },
    [calculateItemDiscount]
  );

  // ==================== LIMPIAR DESCUENTO ====================
  const clearGlobalDiscount = useCallback(() => {
    setDetails((prevDetails) =>
      prevDetails.map((detail) => ({
        ...detail,
        porcentaje_descuento: 0,
        descuento: 0,
      }))
    );
    setGlobalDiscount(0);
  }, []);

  // ==================== CÁLCULOS ====================

  // Calcular subtotal con precisión
  const calculateSubtotal = useCallback(
    (detail: QuotationUpdateDetailUI): number => {
      const subtotal = multiplyPrecise(detail.cantidad, detail.precio);
      return subtractPrecise(subtotal, detail.descuento);
    },
    []
  );

  //  Calcular total con precisión
  const calculateTotal = useCallback((): number => {
    return details.reduce((acc, detail) => {
      const subtotal = multiplyPrecise(detail.cantidad, detail.precio);
      return addPrecise(acc, subtractPrecise(subtotal, detail.descuento));
    }, 0);
  }, [details]);

  //  Calcular total de descuentos con precisión
  const calculateTotalDiscount = useCallback((): number => {
    return details.reduce((acc, detail) => {
      return addPrecise(acc, detail.descuento);
    }, 0);
  }, [details]);

  const getDiscountPercentage = useCallback((): number => {
    return (
      details.find((p) => isGreaterThanZero(p.porcentaje_descuento))
        ?.porcentaje_descuento ?? 0
    );
  }, [details]);

  // Calcular total antes de descuento con precisión
  const calculateTotalBeforeDiscount = useCallback((): number => {
    return details.reduce((total, detail) => {
      return addPrecise(total, multiplyPrecise(detail.cantidad, detail.precio));
    }, 0);
  }, [details]);

  return {
    discountType,
    globalDiscount,
    details,
    addProduct,
    addMultipleItemsWithQuantity,
    removeProduct,
    updateQuantity,
    updatePrice,
    updateDescription,
    updateBrand,
    applyGlobalDiscount,
    clearGlobalDiscount,
    updateCustomSubtotal,
    calculateSubtotal,
    calculateTotal,
    calculateTotalDiscount,
    getDiscountPercentage,
    calculateTotalBeforeDiscount,
    initializeDetails,
    getCleanDetailsForSubmit,
    setDiscountType,
    setGlobalDiscount,
  };
};

export default useQuotationProductDetails;
