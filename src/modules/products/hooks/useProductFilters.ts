import { useCallback, useState } from "react";
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

    // Debounce de campos de texto
    const [debouncedDescripcion] = useDebounce(filters.descripcion ?? "", 500);
    const [debouncedCodigoOEM] = useDebounce(filters.codigo_oem ?? "", 500);
    const [debouncedCodigoUPC] = useDebounce(filters.codigo_upc ?? "", 500);
    const [debouncedMedida] = useDebounce(filters.medida ?? "", 500);
    const [debouncedNroMotor] = useDebounce(filters.nro_motor ?? "", 500);

    // Filtros con valores debounced para la query
    const debouncedFilters: ProductFilters = {
        ...filters,
        descripcion: debouncedDescripcion || undefined,
        codigo_oem: debouncedCodigoOEM || undefined,
        codigo_upc: debouncedCodigoUPC || undefined,
        medida: debouncedMedida || undefined,
        nro_motor: debouncedNroMotor || undefined,
    };

    const updateFilter = useCallback((key: keyof ProductFilters, value: unknown) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            pagina: 1, // Reset to page 1 when any filter is updated
        }));
    }, []);

    const setPage = useCallback((page: number) => {
        setFilters((prev) => ({ ...prev, pagina: page }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({
            pagina: 1,
            pagina_registros: 25,
            sucursal: defaultSucursal,
            descripcion: "",
            codigo_oem: "",
            codigo_upc: "",
            medida: "",
            nro_motor: "",
        });
    }, [defaultSucursal]);

    return {
        filters,           // Para binding con inputs (valores inmediatos)
        debouncedFilters,  // Para queries (valores con debounce)
        updateFilter,
        setPage,
        resetFilters,
        setFilters,
    };
};