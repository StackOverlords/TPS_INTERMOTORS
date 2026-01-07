import useDebounce from "@/modules/categories/hooks/useDebounce";
import { useCallback, useMemo, useState } from "react";
import type { AccountPayableFilters } from "../types/accountPayableFilters";

interface UseAccountPayableFiltersReturn {
    filters: AccountPayableFilters;
    debouncedFilters: AccountPayableFilters;
    appliedFilters: AccountPayableFilters;
    updateFilter: <K extends keyof AccountPayableFilters>(
        key: K,
        value: AccountPayableFilters[K]
    ) => void;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    applyFilters: () => void;
    resetFilters: () => void;
}

export const useAccountPayableFilters = (
    sucursal: number
): UseAccountPayableFiltersReturn => {
    const initialFilters: AccountPayableFilters = {
        pagina: 1,
        pagina_registros: 25,
        sucursal,
        nro_venta: undefined,
        cliente: undefined,
        tipo_pago: undefined,
        estado_pago: undefined,
        fecha_inicio: undefined,
        fecha_fin: undefined,
        tipo_vencimiento: undefined,
        condicion_vencimiento: undefined,
        condicion_fecha_especifica: undefined,
        fecha_vencimiento_regla: undefined,
        fecha_vencimiento: undefined,
    };

    const [filters, setFilters] = useState<AccountPayableFilters>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<AccountPayableFilters>(initialFilters);

    // Debounce para búsqueda en tiempo real
    const debouncedFilters = useDebounce(filters, 500);

    const updateFilter = useCallback(
        <K extends keyof AccountPayableFilters>(
            key: K,
            value: AccountPayableFilters[K]
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
            debouncedFilters,
            appliedFilters,
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
