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
  baseSalePriceIncrement: number;
  displaySalePriceIncrement: number;
  alternativeSalePrice: number;
  alternativeSalePriceIncrement: number;
  incrementSlider: number;
  assignToAllBalances: boolean;
  assignToAllBranches: boolean;
}

// Estado inicial del formulario
const getInitialFormState = (): UpdatePriceFormState => ({
  costPrice: 0,
  salePrice: 0,
  baseSalePriceIncrement: 0,
  displaySalePriceIncrement: 0,
  alternativeSalePrice: 0,
  alternativeSalePriceIncrement: 0,
  incrementSlider: 0,
  assignToAllBalances: false,
  assignToAllBranches: false,
});

export const useUpdatePriceForm = (detail: ProductStock | null, isOpen?: boolean) => {
  const [formData, setFormData] = useState<UpdatePriceFormState>(getInitialFormState());

  // Calcular porcentaje de incremento con precisión
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
  const calculatePriceWithIncrement = useCallback(
    (basePrice: number, incrementPercent: number): number => {
      const incrementDecimal = dividePrecise(incrementPercent, 100);
      const multiplier = addPrecise(1, incrementDecimal);
      return multiplyPrecise(basePrice, multiplier);
    },
    []
  );

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (isOpen === false) {
      setFormData(getInitialFormState());
    }
  }, [isOpen]);

  // Inicializar formulario con datos del detalle
  useEffect(() => {
    if (!detail) {
      setFormData(getInitialFormState());
      return;
    }

    // Calcular el incremento base que ya tiene el producto
    const baseSalePriceInc = calculateIncrement(detail.costo, detail.precio_venta);
    const altSalePriceInc = calculateIncrement(
      detail.precio_venta,
      detail.precio_venta_alt
    );

    setFormData({
      costPrice: roundTo5Decimals(detail.costo),
      salePrice: roundTo5Decimals(detail.precio_venta),
      baseSalePriceIncrement: roundTo5Decimals(baseSalePriceInc),
      displaySalePriceIncrement: 0,
      alternativeSalePrice: roundTo5Decimals(detail.precio_venta_alt),
      alternativeSalePriceIncrement: roundTo5Decimals(altSalePriceInc),
      incrementSlider: 0,
      assignToAllBalances: false,
      assignToAllBranches: false,
    });
  }, [detail, calculateIncrement]);

  // Manejar cambio en el slider de incremento
  const handleIncrementSlider = useCallback(
    (value: number[]) => {
      const delta = roundTo5Decimals(value[0]);
      
      const totalIncrement = addPrecise(formData.baseSalePriceIncrement, delta);
      
      const newSalePrice = calculatePriceWithIncrement(
        formData.costPrice,
        totalIncrement
      );
      
      const newAltSalePrice = calculatePriceWithIncrement(
        newSalePrice,
        formData.alternativeSalePriceIncrement
      );

      setFormData((prev) => ({
        ...prev,
        incrementSlider: delta,
        displaySalePriceIncrement: delta,
        salePrice: newSalePrice,
        alternativeSalePrice: newAltSalePrice,
      }));
    },
    [
      formData.costPrice,
      formData.baseSalePriceIncrement,
      formData.alternativeSalePriceIncrement,
      calculatePriceWithIncrement,
    ]
  );

  // Manejar cambio en precio de venta
  const handleSalesPriceChange = useCallback(
    (newSalePrice: number) => {
      const safeSalePrice = roundTo5Decimals(newSalePrice);
      
      const totalIncrement = calculateIncrement(formData.costPrice, safeSalePrice);
      
      const delta = totalIncrement - formData.baseSalePriceIncrement;
      
      const newAltSalePrice = calculatePriceWithIncrement(
        safeSalePrice,
        formData.alternativeSalePriceIncrement
      );

      setFormData((prev) => ({
        ...prev,
        salePrice: safeSalePrice,
        displaySalePriceIncrement: roundTo5Decimals(delta),
        incrementSlider: roundTo5Decimals(delta),
        alternativeSalePrice: newAltSalePrice,
      }));
    },
    [
      formData.costPrice,
      formData.baseSalePriceIncrement,
      formData.alternativeSalePriceIncrement,
      calculateIncrement,
      calculatePriceWithIncrement,
    ]
  );

  // Manejar cambio en incremento del precio de venta (input de %)
  const handleSalePriceIncrementChange = useCallback(
    (delta: number) => {
      const safeDelta = roundTo5Decimals(delta);
      
      const totalIncrement = addPrecise(formData.baseSalePriceIncrement, safeDelta);
      
      const newSalePrice = calculatePriceWithIncrement(
        formData.costPrice,
        totalIncrement
      );
      
      const newAltSalePrice = calculatePriceWithIncrement(
        newSalePrice,
        formData.alternativeSalePriceIncrement
      );

      setFormData((prev) => ({
        ...prev,
        displaySalePriceIncrement: safeDelta,
        incrementSlider: safeDelta,
        salePrice: newSalePrice,
        alternativeSalePrice: newAltSalePrice,
      }));
    },
    [
      formData.costPrice,
      formData.baseSalePriceIncrement,
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

  // Calcular el incremento total final para enviar
  const getFinalSalePriceIncrement = useCallback(() => {
    return addPrecise(formData.baseSalePriceIncrement, formData.displaySalePriceIncrement);
  }, [formData.baseSalePriceIncrement, formData.displaySalePriceIncrement]);

  return {
    formData,
    handleIncrementSlider,
    handleSalesPriceChange,
    handleSalePriceIncrementChange,
    handleAlternativeSalePriceChange,
    handleAlternativeSalePriceIncrementChange,
    handleAssignmentChange,
    getFinalSalePriceIncrement,
  };
};