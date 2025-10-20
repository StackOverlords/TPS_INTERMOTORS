import { useCallback, useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import type { ReturnsFilters } from "../types/returnFilters.types";

// Helper para limpiar filtros opcionales
const cleanFilters = (filters: ReturnsFilters): ReturnsFilters => ({
    ...filters,
    codigo_oem_producto: filters.codigo_oem_producto || undefined,
    keywords: filters.keywords || undefined,
});

export const useReturnsFilters = (defaultSucursal: number) => {

    // Memoizar las fechas para evitar recrearlas en cada render
    const defaultDates = useMemo(() => {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        return { today, lastMonth };
    }, []);

    const [filters, setFilters] = useState<ReturnsFilters>({
        pagina: 1,
        pagina_registros: 25,
        sucursal: defaultSucursal,
        codigo_oem_producto: "",
        keywords: "",
        fecha_fin: defaultDates.today,
        fecha_inicio: defaultDates.lastMonth
    });

    const [appliedFilters, setAppliedFilters] = useState<ReturnsFilters>(filters);
    const [debouncedFilters] = useDebounce(filters, 500);

    const cleanedDebouncedFilters = useMemo(
        () => cleanFilters(debouncedFilters),
        [debouncedFilters]
    );

    const updateFilter = useCallback(
        (key: keyof ReturnsFilters, value: ReturnsFilters[keyof ReturnsFilters]) => {
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
        const emptyFilters: ReturnsFilters = {
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