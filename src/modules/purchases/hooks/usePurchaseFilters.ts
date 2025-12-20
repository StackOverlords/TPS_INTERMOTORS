import { useCallback, useEffect, useMemo, useState } from "react";
import type { PurchaseFilters } from "../types/purchaseFilters";
import { useDebounce } from "use-debounce";

// Helper para limpiar filtros opcionales
const cleanFilters = (filters: PurchaseFilters): PurchaseFilters => ({
    ...filters,
    codigo_oem_producto: filters.codigo_oem_producto || undefined,
    keywords: filters.keywords || undefined,
});


export const usePurchaseFilters = (defaultSucursal: number) => {
    // Memoizar las fechas para evitar recrearlas en cada render
    const defaultDates = useMemo(() => {
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);

        // Formatear fechas a string YYYY-MM-DD
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return {
            today: formatDate(today),
            threeMonthsAgo: formatDate(threeMonthsAgo)
        };
    }, []);

    const [filters, setFilters] = useState<PurchaseFilters>({
        pagina: 1,
        pagina_registros: 25,
        sucursal: defaultSucursal,
        codigo_oem_producto: "",
        keywords: "",
        fecha_fin: defaultDates.today,
        fecha_inicio: defaultDates.threeMonthsAgo
    });

    const [appliedFilters, setAppliedFilters] = useState<PurchaseFilters>(filters);
    const [debouncedFilters] = useDebounce(filters, 500);

    const cleanedDebouncedFilters = useMemo(
        () => cleanFilters(debouncedFilters),
        [debouncedFilters]
    );

    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            sucursal: defaultSucursal,
            pagina: 1,
        }));
        setAppliedFilters((prev) => ({
            ...prev,
            sucursal: defaultSucursal,
            pagina: 1,
        }));
    }, [defaultSucursal]);

    const updateFilter = useCallback(
        (key: keyof PurchaseFilters, value: PurchaseFilters[keyof PurchaseFilters]) => {
            setFilters((prev) => ({
                ...prev,
                [key]: value,
                pagina: key === 'pagina' || key === 'pagina_registros' ? prev.pagina : 1,
            }));
        },
        []
    );

    const setPage = useCallback((page: number) => {
        setFilters((prev) => ({ ...prev, pagina: page }));
        setAppliedFilters((prev) => ({ ...prev, pagina: page }));
    }, []);

    const setPageSize = useCallback((pageSize: number) => {
        setFilters((prev) => ({ ...prev, pagina_registros: pageSize, pagina: 1 }));
        setAppliedFilters((prev) => ({ ...prev, pagina_registros: pageSize, pagina: 1 }));
    }, []);

    const resetFilters = useCallback(() => {
        const emptyFilters: PurchaseFilters = {
            pagina: 1,
            pagina_registros: 25,
            sucursal: defaultSucursal,
            codigo_oem_producto: "",
            keywords: "",
            fecha_fin: defaultDates.today,
            fecha_inicio: defaultDates.threeMonthsAgo
        };
        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
    }, [defaultSucursal, defaultDates]);

    const applyFilters = useCallback(() => {
        setAppliedFilters({ ...filters, pagina: 1 }); // Reset página al aplicar
    }, [filters]);

    return {
        filters,
        debouncedFilters: cleanedDebouncedFilters,
        appliedFilters: cleanFilters(appliedFilters), // Limpiar también los aplicados
        updateFilter,
        setPage,
        setPageSize,
        resetFilters,
        setFilters,
        applyFilters,
    };
};