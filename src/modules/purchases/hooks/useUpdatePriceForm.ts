import { useState, useEffect, useCallback } from "react";
import type { ProductStock } from "@/modules/products/types/productStock";
import {
  addPrecise,
  dividePrecise,
  multiplyPrecise,
  roundTo5Decimals,
} from "@/utils/decimalUtils";

interface UpdatePriceFormState {
  costPrice: number;
  salePrice: number;
  salePriceIncrement: number;
  alternativeSalePrice: number;
  alternativeSalePriceIncrement: number;
  incrementSlider: number;
  assignToAllBalances: boolean;
  assignToAllBranches: boolean;
}

export const useUpdatePriceForm = (detail: ProductStock | null) => {
  const [formData, setFormData] = useState<UpdatePriceFormState>({
    costPrice: 0,
    salePrice: 0,
    salePriceIncrement: 0,
    alternativeSalePrice: 0,
    alternativeSalePriceIncrement: 0,
    incrementSlider: 0,
    assignToAllBalances: false,
    assignToAllBranches: false,
  });

  // Calcular porcentaje de incremento con precisión
  // Formula: ((precio_final - precio_base) / precio_base) * 100
  const calculateIncrement = useCallback(
    (basePrice: number, finalPrice: number): number => {
      if (basePrice === 0) return 0;

      const difference = finalPrice - basePrice;
      const increment = dividePrecise(difference, basePrice);
      return multiplyPrecise(increment, 100);
    },
    []
  );

  // Calcular precio con incremento con precisión
  // Formula: precio_base * (1 + incremento/100)
  const calculatePriceWithIncrement = useCallback(
    (basePrice: number, incrementPercent: number): number => {
      const incrementDecimal = dividePrecise(incrementPercent, 100);
      const multiplier = addPrecise(1, incrementDecimal);
      return multiplyPrecise(basePrice, multiplier);
    },
    []
  );

  // Inicializar formulario con datos del detalle
  useEffect(() => {
    if (!detail) return;

    const salePriceInc = calculateIncrement(detail.costo, detail.precio_venta);
    const altSalePriceInc = calculateIncrement(
      detail.precio_venta,
      detail.precio_venta_alt
    );

    setFormData({
      costPrice: roundTo5Decimals(detail.costo),
      salePrice: roundTo5Decimals(detail.precio_venta),
      salePriceIncrement: roundTo5Decimals(salePriceInc),
      alternativeSalePrice: roundTo5Decimals(detail.precio_venta_alt),
      alternativeSalePriceIncrement: roundTo5Decimals(altSalePriceInc),
      incrementSlider: roundTo5Decimals(salePriceInc),
      assignToAllBalances: false,
      assignToAllBranches: false,
    });
  }, [detail, calculateIncrement]);

  // Manejar cambio en el slider de incremento
  const handleIncrementSlider = useCallback(
    (value: number[]) => {
      const increment = roundTo5Decimals(value[0]);
      const newSalePrice = calculatePriceWithIncrement(
        formData.costPrice,
        increment
      );
      const newAltSalePrice = calculatePriceWithIncrement(
        newSalePrice,
        formData.alternativeSalePriceIncrement
      );

      setFormData((prev) => ({
        ...prev,
        incrementSlider: increment,
        salePriceIncrement: increment,
        salePrice: newSalePrice,
        alternativeSalePrice: newAltSalePrice,
      }));
    },
    [
      formData.costPrice,
      formData.alternativeSalePriceIncrement,
      calculatePriceWithIncrement,
    ]
  );

  // Manejar cambio en precio de venta
  const handleSalesPriceChange = useCallback(
    (newSalePrice: number) => {
      const safeSalePrice = roundTo5Decimals(newSalePrice);
      const increment = calculateIncrement(formData.costPrice, safeSalePrice);
      const newAltSalePrice = calculatePriceWithIncrement(
        safeSalePrice,
        formData.alternativeSalePriceIncrement
      );

      setFormData((prev) => ({
        ...prev,
        salePrice: safeSalePrice,
        salePriceIncrement: increment,
        incrementSlider: increment,
        alternativeSalePrice: newAltSalePrice,
      }));
    },
    [
      formData.costPrice,
      formData.alternativeSalePriceIncrement,
      calculateIncrement,
      calculatePriceWithIncrement,
    ]
  );

  // Manejar cambio en incremento del precio de venta
  const handleSalePriceIncrementChange = useCallback(
    (increment: number) => {
      const safeIncrement = roundTo5Decimals(increment);
      const newSalePrice = calculatePriceWithIncrement(
        formData.costPrice,
        safeIncrement
      );
      const newAltSalePrice = calculatePriceWithIncrement(
        newSalePrice,
        formData.alternativeSalePriceIncrement
      );

      setFormData((prev) => ({
        ...prev,
        salePriceIncrement: safeIncrement,
        incrementSlider: safeIncrement,
        salePrice: newSalePrice,
        alternativeSalePrice: newAltSalePrice,
      }));
    },
    [
      formData.costPrice,
      formData.alternativeSalePriceIncrement,
      calculatePriceWithIncrement,
    ]
  );

  // Manejar cambio en precio de venta alternativo
  const handleAlternativeSalePriceChange = useCallback(
    (newAltPrice: number) => {
      const safeAltPrice = roundTo5Decimals(newAltPrice);
      const increment = calculateIncrement(formData.salePrice, safeAltPrice);

      setFormData((prev) => ({
        ...prev,
        alternativeSalePrice: safeAltPrice,
        alternativeSalePriceIncrement: increment,
      }));
    },
    [formData.salePrice, calculateIncrement]
  );

  // Manejar cambio en incremento del precio alternativo
  const handleAlternativeSalePriceIncrementChange = useCallback(
    (increment: number) => {
      const safeIncrement = roundTo5Decimals(increment);
      const newAltPrice = calculatePriceWithIncrement(
        formData.salePrice,
        safeIncrement
      );

      setFormData((prev) => ({
        ...prev,
        alternativeSalePriceIncrement: safeIncrement,
        alternativeSalePrice: newAltPrice,
      }));
    },
    [formData.salePrice, calculatePriceWithIncrement]
  );

  // Manejar cambio en opciones de asignación
  const handleAssignmentChange = useCallback(
    (field: "assignToAllBalances" | "assignToAllBranches", value: boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        // Si se activa una opción, desactivar la otra
        ...(field === "assignToAllBalances" && value
          ? { assignToAllBranches: false }
          : {}),
        ...(field === "assignToAllBranches" && value
          ? { assignToAllBalances: false }
          : {}),
      }));
    },
    []
  );

  return {
    formData,
    handleIncrementSlider,
    handleSalesPriceChange,
    handleSalePriceIncrementChange,
    handleAlternativeSalePriceChange,
    handleAlternativeSalePriceIncrementChange,
    handleAssignmentChange,
  };
};
