import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import type { TransfersFilters } from "../types/transferFilters.types";

// Helper para limpiar filtros opcionales
const cleanFilters = (filters: TransfersFilters): TransfersFilters => ({
    ...filters,
    codigo_interno: filters.codigo_interno || undefined,
    codigo_oem_producto: filters.codigo_oem_producto || undefined,
    keywords: filters.keywords || undefined,
    sucursal_origen: filters.sucursal_origen || undefined,
    sucursal_destino: filters.sucursal_destino || undefined,
});

export const useTransfersFilters = (defaultSucursal: number) => {
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

    const [filters, setFilters] = useState<TransfersFilters>({
        pagina: 1,
        codigo_interno: "",
        pagina_registros: 25,
        sucursal: defaultSucursal,
        codigo_oem_producto: "",
        keywords: "",
        fecha_fin: defaultDates.today,
        fecha_inicio: defaultDates.threeMonthsAgo,
        direccion: 'entrantes', // Por defecto mostrar transferencias entrantes
        sucursal_destino: defaultSucursal, // Nosotros somos el destino
    });

    const [appliedFilters, setAppliedFilters] = useState<TransfersFilters>(filters);
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
        (key: keyof TransfersFilters, value: TransfersFilters[keyof TransfersFilters]) => {
            setFilters((prev) => {
                const newFilters: TransfersFilters = {
                    ...prev,
                    [key]: value,
                    pagina: key === 'pagina' || key === 'pagina_registros' ? prev.pagina : 1,
                };

                // Si se está actualizando el filtro de dirección
                if (key === 'direccion') {
                    if (value === 'entrantes') {
                        // Transferencias entrantes: nosotros somos el destino
                        newFilters.sucursal_destino = defaultSucursal;
                        newFilters.sucursal_origen = undefined;
                    } else if (value === 'salientes') {
                        // Transferencias salientes: nosotros somos el origen
                        newFilters.sucursal_origen = defaultSucursal;
                        newFilters.sucursal_destino = undefined;
                    } else {
                        // Sin dirección específica
                        newFilters.sucursal_origen = undefined;
                        newFilters.sucursal_destino = undefined;
                    }
                }

                return newFilters;
            });
        },
        [defaultSucursal]
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
        const emptyFilters: TransfersFilters = {
            pagina: 1,
            codigo_interno: "",
            pagina_registros: 25,
            sucursal: defaultSucursal,
            codigo_oem_producto: "",
            keywords: "",
            fecha_fin: defaultDates.today,
            fecha_inicio: defaultDates.threeMonthsAgo,
            direccion: 'entrantes', // Por defecto mostrar transferencias entrantes
            sucursal_destino: defaultSucursal, // Nosotros somos el destino
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
