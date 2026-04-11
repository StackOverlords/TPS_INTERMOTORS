import useDebounce from "@/modules/categories/hooks/useDebounce";
import { useCallback, useMemo, useState } from "react";
import type { AccountReceivableFilters } from "../types/accountReceivableFilters";

interface UseAccountReceivableFiltersReturn {
    filters: AccountReceivableFilters;
    debouncedFilters: AccountReceivableFilters;
    appliedFilters: AccountReceivableFilters;
    updateFilter: <K extends keyof AccountReceivableFilters>(
        key: K,
        value: AccountReceivableFilters[K]
    ) => void;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    applyFilters: () => void;
    resetFilters: () => void;
}

// Helper para agregar horas a las fechas antes de enviar al backend
const addTimeToFilters = (filters: AccountReceivableFilters): AccountReceivableFilters => ({
    ...filters,
    // Agregar hora al inicio del día para fecha_inicio (00:00:00)
    fecha_inicio: filters.fecha_inicio ? `${filters.fecha_inicio}T00:00:00` : undefined,
    // Agregar hora al final del día para fecha_fin (23:59:59)
    fecha_fin: filters.fecha_fin ? `${filters.fecha_fin}T23:59:59` : undefined,
});

// Función helper para obtener las fechas por defecto (últimos 3 meses)
const getDefaultDateRange = () => {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    // Formatear a YYYY-MM-DD
    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        fecha_inicio: formatDate(threeMonthsAgo),
        fecha_fin: formatDate(today),
    };
};

export const useAccountReceivableFilters = (
    sucursal: number
): UseAccountReceivableFiltersReturn => {
    const defaultDates = useMemo(() => getDefaultDateRange(), []);

    const initialFilters: AccountReceivableFilters = useMemo(() => ({
        pagina: 1,
        pagina_registros: 25,
        sucursal,
        nro_venta: undefined,
        cliente: undefined,
        tipo_pago: undefined,
        estado_pago: undefined,
        fecha_inicio: defaultDates.fecha_inicio,
        fecha_fin: defaultDates.fecha_fin,
        tipo_vencimiento: undefined,
        condicion_vencimiento: undefined,
        condicion_fecha_especifica: undefined,
        fecha_vencimiento_regla: undefined,
        fecha_vencimiento: undefined,
    }), [sucursal, defaultDates.fecha_inicio, defaultDates.fecha_fin]);

    const [filters, setFilters] = useState<AccountReceivableFilters>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<AccountReceivableFilters>(initialFilters);

    // Debounce para búsqueda en tiempo real
    const debouncedFilters = useDebounce(filters, 500);

    const updateFilter = useCallback(
        <K extends keyof AccountReceivableFilters>(
            key: K,
            value: AccountReceivableFilters[K]
        ) => {
            setFilters((prev: any) => {
                const newFilters = {
                    ...prev,
                    [key]: value,
                    pagina: key === "pagina" ? value : 1,
                };

                // Lógica de exclusividad mutua
                if (key === "condicion_vencimiento") {
                    if (value) {
                        // Si se activa vencimiento, desactivar fecha específica
                        newFilters.condicion_fecha_especifica = false;
                        newFilters.fecha_vencimiento_regla = undefined;
                        newFilters.fecha_vencimiento = undefined;
                    } else {
                        // Si se desactiva, limpiar su valor
                        newFilters.tipo_vencimiento = undefined;
                    }
                }

                if (key === "condicion_fecha_especifica") {
                    if (value) {
                        // Si se activa fecha específica, desactivar vencimiento
                        newFilters.condicion_vencimiento = false;
                        newFilters.tipo_vencimiento = undefined;
                    } else {
                        // Si se desactiva, limpiar sus valores
                        newFilters.fecha_vencimiento_regla = undefined;
                        newFilters.fecha_vencimiento = undefined;
                    }
                }

                return newFilters;
            });
        },
        []
    );

    const setPage = useCallback((page: number) => {
        setFilters((prev) => ({ ...prev, pagina: page }));
        setAppliedFilters((prev) => ({ ...prev, pagina: page }));
    }, []);

    const setPageSize = useCallback((size: number) => {
        setFilters((prev) => ({ ...prev, pagina_registros: size, pagina: 1 }));
        setAppliedFilters((prev) => ({ ...prev, pagina_registros: size, pagina: 1 }));
    }, []);

    const applyFilters = useCallback(() => {
        setAppliedFilters({ ...filters });
    }, [filters]);

    const resetFilters = useCallback(() => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
    }, [initialFilters]);

    return useMemo(
        () => ({
            filters,
            debouncedFilters: addTimeToFilters(debouncedFilters),
            appliedFilters: addTimeToFilters(appliedFilters),
            updateFilter,
            setPage,
            setPageSize,
            applyFilters,
            resetFilters,
        }),
        [
            filters,
            debouncedFilters,
            appliedFilters,
            updateFilter,
            setPage,
            setPageSize,
            applyFilters,
            resetFilters,
        ]
    );
};
