import { useCallback, useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import type { ProductFilters } from "../types/productFilters";

export const useProductFilters = (defaultSucursal: number) => {
    const [filters, setFilters] = useState<ProductFilters>({
        pagina: 1,
        pagina_registros: 25,
        sucursal: defaultSucursal,
        descripcion: "",
        codigo_oem: "",
        codigo_upc: "",
        medida: "",
        nro_motor: "",
    });

    // Snapshot de filtros para búsqueda manual
    const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(filters);

    // Debounce del objeto completo en lugar de campos individuales
    const [debouncedFilters] = useDebounce(filters, 500);

    // Filtros con valores limpios para la query (modo realtime)
    const cleanedDebouncedFilters: ProductFilters = useMemo(() => ({
        ...debouncedFilters,
        descripcion: debouncedFilters.descripcion || undefined,
        codigo_oem: debouncedFilters.codigo_oem || undefined,
        codigo_upc: debouncedFilters.codigo_upc || undefined,
        medida: debouncedFilters.medida || undefined,
        nro_motor: debouncedFilters.nro_motor || undefined,
    }), [debouncedFilters]);

    const updateFilter = useCallback((key: keyof ProductFilters, value: unknown) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            pagina: 1, // Reset to page 1 when any filter is updated
        }));
    }, []);

    const setPage = useCallback((page: number) => {
        setFilters((prev) => ({ ...prev, pagina: page }));
        setAppliedFilters((prev) => ({ ...prev, pagina: page }));
    }, []);

    const setPageSize = useCallback((pageSize: number) => {
        setFilters((prev) => ({ ...prev, pagina_registros: pageSize, pagina: 1 }));
        setAppliedFilters((prev) => ({ ...prev, pagina_registros: pageSize, pagina: 1 }));
    }, []);

    const resetFilters = useCallback(() => {
        const emptyFilters = {
            pagina: 1,
            pagina_registros: 25,
            sucursal: defaultSucursal,
            descripcion: "",
            codigo_oem: "",
            codigo_upc: "",
            medida: "",
            nro_motor: "",
        };
        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
    }, [defaultSucursal]);

    // Función para aplicar filtros (modo manual)
    const applyFilters = useCallback(() => {
        setAppliedFilters({ ...filters });
    }, [filters]);

    return {
        filters,           // Para binding con inputs (valores inmediatos)
        debouncedFilters: cleanedDebouncedFilters,  // Para queries en modo realtime (valores con debounce)
        appliedFilters,    // Para queries en modo manual (snapshot cuando se hace clic en buscar)
        updateFilter,
        setPage,
        resetFilters,
        setFilters,
        applyFilters,      // Función para aplicar los filtros actuales
        setPageSize,
    };
};