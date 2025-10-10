import { useFiltersManagement } from "@/modules/shared/hooks/useFiltersManagement";
import type { ProviderFilters } from "../../types/provider.types";

export const useProviderFilters = () => {
    const filtersHook = useFiltersManagement<ProviderFilters>({
        pagina: 1,
        pagina_registros: 10,
        proveedor: "",
        nit: "",
    });

    // Sin debounce - búsqueda manual
    const debouncedFilters: ProviderFilters = {
        ...filtersHook.filters,
    };

    return {
        ...filtersHook,
        filters: filtersHook.filters,
        debouncedFilters,
    };
};
