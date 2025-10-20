import { useCallback, useMemo, useState } from "react";
import type { SalesFilters } from "../types/salesFilters";
import { useDebounce } from "use-debounce";

// Helper para limpiar filtros opcionales
const cleanFilters = (filters: SalesFilters): SalesFilters => ({
    ...filters,
    codigo_oem_producto: filters.codigo_oem_producto || undefined,
    keywords: filters.keywords || undefined,
});

export const useSalesFilters = (defaultSucursal: number) => {

    // Memoizar las fechas para evitar recrearlas en cada render
    const defaultDates = useMemo(() => {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        return { today, lastMonth };
    }, []);

    const [filters, setFilters] = useState<SalesFilters>({
        pagina: 1,
        pagina_registros: 25,
        sucursal: defaultSucursal,
        codigo_oem_producto: "",
        keywords: "",
        fecha_fin: defaultDates.today,
        fecha_inicio: defaultDates.lastMonth
    });

    const [appliedFilters, setAppliedFilters] = useState<SalesFilters>(filters);
    const [debouncedFilters] = useDebounce(filters, 500);

    const cleanedDebouncedFilters = useMemo(
        () => cleanFilters(debouncedFilters),
        [debouncedFilters]
    );

    const updateFilter = useCallback(
        (key: keyof SalesFilters, value: SalesFilters[keyof SalesFilters]) => {
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
        const emptyFilters: SalesFilters = {
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