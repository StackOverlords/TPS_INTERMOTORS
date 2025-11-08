import { useCallback, useState } from "react";
import type { ProductGet } from "../types/ProductGet";

export const useProductSelection = () => {
    const [selectedProductsMap, setSelectedProductsMap] = useState<Map<number, ProductGet>>(new Map());

    // Toggle selección individual
    const toggleProductSelection = useCallback((product: ProductGet) => {
        setSelectedProductsMap(prev => {
            const newMap = new Map(prev);
            if (newMap.has(product.id)) {
                newMap.delete(product.id);
            } else {
                newMap.set(product.id, product);
            }
            return newMap;
        });
    }, []);

    // Toggle selección de múltiples productos
    const toggleAllProductsSelection = useCallback((products: ProductGet[]) => {
        const allSelected = products.every(p => selectedProductsMap.has(p.id));

        setSelectedProductsMap(prev => {
            const newMap = new Map(prev);

            if (allSelected) {
                // Deseleccionar todos los visibles
                products.forEach(p => newMap.delete(p.id));
            } else {
                // Seleccionar todos los visibles
                products.forEach(p => newMap.set(p.id, p));
            }

            return newMap;
        });
    }, [selectedProductsMap]);

    // Verificar si un producto está seleccionado
    const isProductSelected = useCallback((productId: number): boolean => {
        return selectedProductsMap.has(productId);
    }, [selectedProductsMap]);

    // Obtener un producto seleccionado
    const getSelectedProduct = useCallback((productId: number): ProductGet | undefined => {
        return selectedProductsMap.get(productId);
    }, [selectedProductsMap]);

    // Obtener todos los productos seleccionados como array
    const getAllSelectedProducts = useCallback((): ProductGet[] => {
        return Array.from(selectedProductsMap.values());
    }, [selectedProductsMap]);

    // Obtener la cantidad de productos seleccionados
    const getSelectedCount = useCallback((): number => {
        return selectedProductsMap.size;
    }, [selectedProductsMap]);

    // Limpiar todas las selecciones
    const clearAllSelections = useCallback(() => {
        setSelectedProductsMap(new Map());
    }, []);

    // Verificar si todos los productos visibles están seleccionados
    const areAllProductsSelected = useCallback((products: ProductGet[]): boolean => {
        return products.length > 0 && products.every(p => selectedProductsMap.has(p.id));
    }, [selectedProductsMap]);

    return {
        selectedProductsMap,
        toggleProductSelection,
        toggleAllProductsSelection,
        isProductSelected,
        getSelectedProduct,
        getAllSelectedProducts,
        getSelectedCount,
        clearAllSelections,
        areAllProductsSelected,
    };
};