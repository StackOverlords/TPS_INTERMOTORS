import { useState, useCallback, useEffect, useMemo } from "react";
import { type UseFormReturn } from "react-hook-form";
import type {
  SaleUpdateDetailUI,
  SaleUpdateForm,
} from "../types/saleUpdate.type";
import type { ProductGet } from "@/modules/products/types/ProductGet";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import {
  multiplyPrecise,
  dividePrecise,
  calculateAmountFromPercent,
  calculatePercent,
  subtractPrecise,
  isGreaterThanZero,
  addPrecise,
} from "@/utils/decimalUtils";

export type DiscountType = "percentage" | "amount";

interface UseSaleProductDetailsProps {
  formMethods: UseFormReturn<SaleUpdateForm>;
  originalDetails?: SaleUpdateDetailUI[];
}

interface UseSaleProductDetailsReturn {
  discountType: DiscountType;
  globalDiscount: number;
  addProduct: (product: ProductGet | ProductGet[]) => void;
  removeProduct: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updatePrice: (productId: number, price: number) => void;
  applyGlobalDiscount: (discount: number, type: DiscountType) => void;
  clearGlobalDiscount: () => void;
  updateCustomSubtotal: (productId: number, customSubtotal: number) => void;
  addMultipleItemsWithQuantity: (
    products: Array<ProductGet & { quantity?: number }>
  ) => void;
  calculateSubtotal: (detail: SaleUpdateDetailUI) => number;
  calculateTotal: () => number;
  calculateTotalDiscount: () => number;
  getDiscountPercentage: () => number;
  calculateTotalBeforeDiscount: () => number;
  setDiscountType: (type: DiscountType) => void;
  setGlobalDiscount: (discount: number) => void;
}

// Reasigna `orden` secuencialmente. El backend ordena por (orden, id), asi que
// las filas deben quedar sin huecos ni repetidos al agregar o quitar productos.
const reindexOrden = (details: SaleUpdateDetailUI[]): SaleUpdateDetailUI[] =>
  details.map((detail, index) => ({ ...detail, orden: index + 1 }));

const useSaleProductDetailsWithForm = ({
  formMethods,
  originalDetails = [],
}: UseSaleProductDetailsProps): UseSaleProductDetailsReturn => {
  const { setValue, getValues, watch } = formMethods;
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [hasDiscount, setHasDiscount] = useState<boolean>(false);

  const watchedDetalles = watch("detalles");
  const products = useMemo(() => watchedDetalles || [], [watchedDetalles]);

  // Mapa de cantidades originales por producto
  const originalQuantitiesMap = useMemo(() => {
    const map = new Map<number, number>();
    originalDetails.forEach((detail) => {
      if (detail.producto?.id) {
        map.set(detail.producto.id, detail.cantidad);
      }
    });
    return map;
  }, [originalDetails]);

  useEffect(() => {
    if (products.length <= 0) return;
    const existingDiscount = products.find((p) =>
      isGreaterThanZero(p.descuento)
    );
    if (existingDiscount) {
      setHasDiscount(true);
    }
  }, [products]);

  // Función helper para obtener cantidad real (cantidad - cantidad_dev)
  const getRealQuantity = useCallback((detail: SaleUpdateDetailUI): number => {
    const cantidadDev = detail.cantidad_dev ?? 0;
    return detail.cantidad - cantidadDev;
  }, []);

  const calculateItemDiscount = useCallback(
    (precio: number, cantidad: number, porcentajeDescuento: number): number => {
      const subtotal = multiplyPrecise(precio, cantidad);
      return calculateAmountFromPercent(porcentajeDescuento, subtotal);
    },
    []
  );

  const getAvailableStock = useCallback(
    (productId: number, currentStock: number | undefined): number => {
      if (currentStock === undefined) return Infinity;
      const originalQuantity = originalQuantitiesMap.get(productId) ?? 0;
      return currentStock + originalQuantity;
    },
    [originalQuantitiesMap]
  );

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

      const currentProducts = getValues("detalles") || [];
      const productDetail = currentProducts.find(
        (d) => d.producto?.id === productId
      );

      // Verificar si hay devoluciones
      const cantidadDev = productDetail?.cantidad_dev ?? 0;
      if (cantidadDev > 0) {
        showErrorToast({
          title: "No se puede modificar",
          description: "Este producto tiene devoluciones y no se puede editar la cantidad",
          duration: 2000,
        });
        return;
      }

      if (productDetail?.producto) {
        const availableStock = getAvailableStock(
          productId,
          productDetail.producto.stock_actual
        );

        if (quantity > availableStock) {
          showErrorToast({
            title: "Stock insuficiente",
            description: `Solo hay ${availableStock} unidades disponibles`,
            duration: 2000,
          });
          return;
        }
      }

      const updated = currentProducts.map((detail) => {
        if (detail.producto?.id === productId) {
          let newDiscount = detail.descuento;
          if (isGreaterThanZero(detail.porcentaje_descuento)) {
            // Calcular descuento sobre la cantidad real
            const realQuantity = getRealQuantity({ ...detail, cantidad: quantity });
            newDiscount = calculateItemDiscount(
              detail.precio,
              realQuantity,
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
      });

      setValue("detalles", updated);
    },
    [setValue, getValues, getAvailableStock, calculateItemDiscount, getRealQuantity]
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

      const currentProducts = getValues("detalles") || [];
      const updated = currentProducts.map((detail) => {
        if (detail.producto?.id === productId) {
          // Usar cantidad real para calcular el nuevo precio
          const realQuantity = getRealQuantity(detail);
          const newPrice = dividePrecise(customSubtotal, realQuantity);
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
      });

      setValue("detalles", updated);
    },
    [setValue, getValues, getRealQuantity]
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

      const currentProducts = getValues("detalles") || [];
      const updated = currentProducts.map((detail) => {
        if (detail.producto?.id === productId) {
          let newDiscount = detail.descuento;
          if (isGreaterThanZero(detail.porcentaje_descuento)) {
            // Calcular descuento sobre cantidad real
            const realQuantity = getRealQuantity(detail);
            newDiscount = calculateItemDiscount(
              price,
              realQuantity,
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
      });

      setValue("detalles", updated);
    },
    [setValue, getValues, calculateItemDiscount, getRealQuantity]
  );

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

      const currentProducts = getValues("detalles") || [];

      if (currentProducts.length === 0) {
        showErrorToast({
          title: "Sin productos",
          description: "No hay productos para aplicar descuento",
          duration: 2000,
        });
        return;
      }

      let updated: SaleUpdateDetailUI[];

      if (type === "percentage") {
        if (discount > 100) {
          showErrorToast({
            title: "Descuento inválido",
            description: "El descuento porcentual no puede ser mayor a 100%",
            duration: 2000,
          });
          return;
        }

        updated = currentProducts.map((detail) => {
          // Calcular descuento sobre cantidad real
          const realQuantity = getRealQuantity(detail);
          const discountAmount = calculateItemDiscount(
            detail.precio,
            realQuantity,
            discount
          );

          return {
            ...detail,
            porcentaje_descuento: discount,
            descuento: discountAmount,
          };
        });
      } else {
        // Calcular total sin descuento usando cantidades reales
        const totalWithoutDiscount = currentProducts.reduce((acc, detail) => {
          const realQuantity = getRealQuantity(detail);
          return addPrecise(
            acc,
            multiplyPrecise(realQuantity, detail.precio)
          );
        }, 0);

        if (discount > totalWithoutDiscount) {
          showErrorToast({
            title: "Descuento inválido",
            description: "El descuento no puede ser mayor al total de la venta",
            duration: 2000,
          });
          return;
        }

        const discountPercentage = calculatePercent(
          discount,
          totalWithoutDiscount
        );

        updated = currentProducts.map((detail) => {
          const realQuantity = getRealQuantity(detail);
          const discountAmount = calculateItemDiscount(
            detail.precio,
            realQuantity,
            discountPercentage
          );

          return {
            ...detail,
            porcentaje_descuento: discountPercentage,
            descuento: discountAmount,
          };
        });
      }

      setValue("detalles", updated);
      setDiscountType(type);
      setGlobalDiscount(discount);
    },
    [setValue, getValues, calculateItemDiscount, getRealQuantity]
  );

  // ==================== LIMPIAR DESCUENTO GLOBAL ====================
  const clearGlobalDiscount = useCallback(() => {
    const currentProducts = getValues("detalles") || [];

    const updated = currentProducts.map((detail) => ({
      ...detail,
      porcentaje_descuento: 0,
      descuento: 0,
    }));

    setValue("detalles", updated);
    setGlobalDiscount(0);
  }, [setValue, getValues]);

  // ==================== CÁLCULOS ====================

  // Calcular subtotal usando cantidad real
  const calculateSubtotal = useCallback(
    (detail: SaleUpdateDetailUI): number => {
      const realQuantity = getRealQuantity(detail);
      const subtotal = multiplyPrecise(realQuantity, detail.precio);
      return subtractPrecise(subtotal, detail.descuento);
    },
    [getRealQuantity]
  );

  const calculateTotal = useCallback((): number => {
    return products.reduce((acc, detail) => {
      return addPrecise(acc, calculateSubtotal(detail));
    }, 0);
  }, [products, calculateSubtotal]);

  const calculateTotalDiscount = useCallback((): number => {
    return products.reduce((acc, detail) => {
      return addPrecise(acc, detail.descuento);
    }, 0);
  }, [products]);

  const getDiscountPercentage = useCallback((): number => {
    return (
      products.find((p) => isGreaterThanZero(p.porcentaje_descuento))
        ?.porcentaje_descuento ?? 0
    );
  }, [products]);

  // Total antes de descuento usando cantidades reales
  const calculateTotalBeforeDiscount = useCallback((): number => {
    return products.reduce((total, detail) => {
      const realQuantity = getRealQuantity(detail);
      return addPrecise(total, multiplyPrecise(realQuantity, detail.precio));
    }, 0);
  }, [products, getRealQuantity]);

  // ==================== AGREGAR PRODUCTO(S) ====================
  const addProduct = useCallback(
    (input: ProductGet | ProductGet[]) => {
      const productsToAdd = Array.isArray(input) ? input : [input];
      const currentProducts = getValues("detalles") || [];
      const updated = [...currentProducts];
      let addedCount = 0;
      let skippedCount = 0;

      const productWithDiscount = currentProducts.find(
        (p) =>
          isGreaterThanZero(p.descuento) &&
          isGreaterThanZero(p.porcentaje_descuento)
      );
      const existingDiscountPercentage =
        productWithDiscount?.porcentaje_descuento ?? 0;

      productsToAdd.forEach((product) => {
        const existingIndex = updated.findIndex(
          (d) => d.producto?.id === product.id
        );
        const currentQuantityInSale =
          existingIndex !== -1 ? updated[existingIndex].cantidad : 0;
        const availableStock = getAvailableStock(
          product.id,
          product.stock_actual
        );

        if (existingIndex !== -1) {
          const item = updated[existingIndex];
          const newQuantity = currentQuantityInSale + 1;

          if (newQuantity > availableStock) {
            skippedCount++;
            return;
          }

          // Calcular descuento sobre cantidad real
          const realQuantity = getRealQuantity({ ...item, cantidad: newQuantity });
          const newDiscount = calculateItemDiscount(
            item.precio,
            realQuantity,
            item.porcentaje_descuento
          );

          updated[existingIndex] = {
            ...updated[existingIndex],
            cantidad: newQuantity,
            descuento: newDiscount,
          };
          addedCount++;
        } else {
          if (availableStock < 1) {
            skippedCount++;
            return;
          }

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

          const newDetail: SaleUpdateDetailUI = {
            id_producto: product.id,
            cantidad: 1,
            descuento: descuento,
            porcentaje_descuento: porcentaje_descuento,
            id_detalle_venta: null,
            precio: product.precio_venta,
            orden: currentProducts.length + 1,
            cantidad_dev: 0, // Nuevo producto no tiene devoluciones
            producto: {
              id: product.id,
              categoria: product.categoria ?? null,
              codigo_oem: product.codigo_oem ?? null,
              codigo_upc: product.codigo_upc ?? null,
              descripcion: product.descripcion,
              marca: product.marca ?? "",
              precio_venta: product.precio_venta,
              stock_actual: product.stock_actual,
            },
          };

          updated.push(newDetail);
          addedCount++;
        }
      });

      setValue("detalles", reindexOrden(updated));
      showToastSummary(input, addedCount, skippedCount, productsToAdd);
    },
    [setValue, getValues, hasDiscount, getAvailableStock, calculateItemDiscount, getRealQuantity]
  );

  // ==================== QUITAR PRODUCTO ====================
  const removeProduct = useCallback(
    (productId: number) => {
      const currentProducts = getValues("detalles") || [];

      // if (currentProducts.length <= 1) {
      //   showErrorToast({
      //     title: "No se puede eliminar",
      //     description: "Debe haber al menos un producto en la venta",
      //     duration: 2000,
      //   });
      //   return;
      // }

      const updated = currentProducts.filter(
        (detail) => detail.producto?.id !== productId
      );
      setValue("detalles", reindexOrden(updated));
    },
    [setValue, getValues]
  );

  // ==================== AGREGAR MÚLTIPLES PRODUCTOS ====================
  const addMultipleItemsWithQuantity = useCallback(
    (productsToAdd: Array<ProductGet & { quantity?: number }>) => {
      const currentProducts = getValues("detalles") || [];
      const updated = [...currentProducts];
      let addedCount = 0;
      let skippedCount = 0;
      const skippedProducts: string[] = [];

      const productWithDiscount = currentProducts.find(
        (p) =>
          isGreaterThanZero(p.descuento) &&
          isGreaterThanZero(p.porcentaje_descuento)
      );
      const existingDiscountPercentage =
        productWithDiscount?.porcentaje_descuento ?? 0;

      productsToAdd.forEach((product) => {
        const requestedQuantity = product.quantity ?? 1;
        const existingIndex = updated.findIndex(
          (d) => d.producto?.id === product.id
        );
        const currentQuantityInSale =
          existingIndex !== -1 ? updated[existingIndex].cantidad : 0;
        const availableStock = getAvailableStock(
          product.id,
          product.stock_actual
        );

        if (existingIndex !== -1) {
          const item = updated[existingIndex];
          const newQuantity = currentQuantityInSale + requestedQuantity;

          if (newQuantity > availableStock) {
            skippedCount++;
            skippedProducts.push(
              `${product.descripcion} (solicitado: ${requestedQuantity}, disponible: ${availableStock - currentQuantityInSale})`
            );
            return;
          }

          // Calcular descuento sobre cantidad real
          const realQuantity = getRealQuantity({ ...item, cantidad: newQuantity });
          const newDiscount = calculateItemDiscount(
            item.precio,
            realQuantity,
            item.porcentaje_descuento
          );

          updated[existingIndex] = {
            ...updated[existingIndex],
            cantidad: newQuantity,
            descuento: newDiscount,
          };
          addedCount++;
        } else {
          if (requestedQuantity > availableStock) {
            skippedCount++;
            skippedProducts.push(
              `${product.descripcion} (solicitado: ${requestedQuantity}, disponible: ${availableStock})`
            );
            return;
          }

          let porcentaje_descuento = 0;
          let descuento = 0;

          if (hasDiscount && isGreaterThanZero(existingDiscountPercentage)) {
            porcentaje_descuento = existingDiscountPercentage;
            descuento = calculateItemDiscount(
              product.precio_venta,
              requestedQuantity,
              existingDiscountPercentage
            );
          }

          const newDetail: SaleUpdateDetailUI = {
            id_producto: product.id,
            cantidad: requestedQuantity,
            descuento: descuento,
            porcentaje_descuento: porcentaje_descuento,
            id_detalle_venta: null,
            precio: product.precio_venta,
            orden: currentProducts.length + 1,
            cantidad_dev: 0, // Nuevo producto no tiene devoluciones
            producto: {
              id: product.id,
              categoria: product.categoria ?? null,
              codigo_oem: product.codigo_oem ?? null,
              codigo_upc: product.codigo_upc ?? null,
              descripcion: product.descripcion,
              marca: product.marca ?? "",
              precio_venta: product.precio_venta,
              stock_actual: product.stock_actual,
            },
          };

          updated.push(newDetail);
          addedCount++;
        }
      });

      setValue("detalles", reindexOrden(updated));

      if (addedCount > 0) {
        showSuccessToast({
          title: "Productos agregados",
          description: `${addedCount} producto(s) agregados correctamente`,
          duration: 2000,
        });
      }
      if (skippedCount > 0) {
        showErrorToast({
          title: "Stock insuficiente",
          description:
            skippedProducts.length > 0
              ? skippedProducts.join(", ")
              : `${skippedCount} producto(s) no agregados por stock insuficiente`,
          duration: 2000,
        });
      }
    },
    [setValue, getValues, hasDiscount, getAvailableStock, calculateItemDiscount, getRealQuantity]
  );

  const showToastSummary = (
    input: ProductGet | ProductGet[],
    addedCount: number,
    skippedCount: number,
    products: ProductGet[]
  ) => {
    if (Array.isArray(input)) {
      if (addedCount > 0) {
        showSuccessToast({
          title: "Productos agregados",
          description: `${addedCount} producto(s) agregados correctamente`,
          duration: 2000,
        });
      }
      if (skippedCount > 0) {
        showErrorToast({
          title: "Stock insuficiente",
          description: `${skippedCount} producto(s) no agregados por stock insuficiente`,
          duration: 2000,
        });
      }
    } else {
      if (addedCount > 0) {
        showSuccessToast({
          title: "Producto agregado",
          description: `${products[0].descripcion} agregado correctamente`,
          duration: 2000,
        });
      }
      if (skippedCount > 0) {
        showErrorToast({
          title: "Stock insuficiente",
          description: `No hay stock disponible para ${products[0].descripcion}`,
          duration: 2000,
        });
      }
    }
  };

  return {
    discountType,
    globalDiscount,
    addProduct,
    removeProduct,
    updateQuantity,
    updatePrice,
    applyGlobalDiscount,
    clearGlobalDiscount,
    updateCustomSubtotal,
    addMultipleItemsWithQuantity,
    calculateSubtotal,
    calculateTotal,
    calculateTotalDiscount,
    getDiscountPercentage,
    calculateTotalBeforeDiscount,
    setDiscountType,
    setGlobalDiscount,
  };
};

export default useSaleProductDetailsWithForm;