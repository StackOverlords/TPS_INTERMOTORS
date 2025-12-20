import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import type { OrdersFilters } from "../types/orderFilters.types";

// Helper para limpiar filtros opcionales
const cleanFilters = (filters: OrdersFilters): OrdersFilters => ({
    ...filters,
    codigo_oem_producto: filters.codigo_oem_producto || undefined,
    keywords: filters.keywords || undefined,
});


export const useOrdersFilters = (defaultSucursal: number) => {

    // Memoizar las fechas para evitar recrearlas en cada render
    const defaultDates = useMemo(() => {
        const today = new Date();
        const lastThreeMonths = new Date(today);
        lastThreeMonths.setMonth(today.getMonth() - 3);

        return {
            today,
            lastThreeMonths,
        };
    }, []);

    const [filters, setFilters] = useState<OrdersFilters>({
        pagina: 1,
        pagina_registros: 25,
        sucursal: defaultSucursal,
        codigo_oem_producto: "",
        keywords: "",
        fecha_fin: defaultDates.today,
        fecha_inicio: defaultDates.lastThreeMonths
    });

    const [appliedFilters, setAppliedFilters] = useState<OrdersFilters>(filters);
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
        (key: keyof OrdersFilters, value: OrdersFilters[keyof OrdersFilters]) => {
            setFilters((prev) => {
                if (prev[key] === value) return prev;
                return {
                    ...prev,
                    [key]: value,
                    pagina: key === 'pagina' || key === 'pagina_registros' ? prev.pagina : 1,
                };
            });
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
        const emptyFilters: OrdersFilters = {
            pagina: 1,
            pagina_registros: 25,
            sucursal: defaultSucursal,
            codigo_oem_producto: "",
            keywords: "",
            fecha_fin: undefined,
            fecha_inicio: undefined
        };
        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
    }, [defaultSucursal]);

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
