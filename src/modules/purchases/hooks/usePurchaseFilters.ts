import { useState, useCallback } from "react";
import type { PurchaseFilters } from "../types/purchaseFilters";

export const usePurchaseFilters = (defaultSucursal: number) => {
    const [filters, setFilters] = useState<PurchaseFilters>({
        pagina: 1,
        pagina_registros: 10,
        sucursal: defaultSucursal,
        keywords: "",
    });

    const updateFilter = useCallback((key: keyof PurchaseFilters, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            pagina: key === 'pagina' ? prev.pagina : 1, // Reset to page 1 when any filter is updated except pagina itself
        }));
    }, []);

    const setPage = useCallback((page: number) => {
        setFilters((prev) => ({ ...prev, pagina: page }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({
            pagina: 1,
            pagina_registros: 10,
            sucursal: defaultSucursal,
        });
    }, [defaultSucursal]);

    return {
        filters,
        updateFilter,
        setPage,
        resetFilters,
        setFilters,
    };
};
