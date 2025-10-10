import { useFiltersManagement } from "@/modules/shared/hooks/useFiltersManagement";
import type { CustomerFilters } from "../../types/customer.types";

export const useCustomerFilters = () => {
    const filtersHook = useFiltersManagement<CustomerFilters>({
        pagina: 1,
        pagina_registros: 20,
        cliente: "",
        nit: "",
    });

    // Sin debounce - búsqueda manual
    const debouncedFilters: CustomerFilters = {
        ...filtersHook.filters,
    };

    return {
        ...filtersHook,
        filters: filtersHook.filters,
        debouncedFilters,
    };
};
