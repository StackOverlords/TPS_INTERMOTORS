import { useFiltersManagement } from "@/modules/shared/hooks/useFiltersManagement";
import { useDebounce } from "use-debounce";
import type { BranchFilters } from "../../types/branch.types";

export const useBranchFilters = () => {
    const filtersHook = useFiltersManagement<BranchFilters>({
        pagina: 1,
        pagina_registros: 25,
        nombre: "",
    });

    const [debouncedNombre] = useDebounce(filtersHook.filters.nombre, 500);

    const debouncedFilters: BranchFilters = {
        ...filtersHook.filters,
        nombre: debouncedNombre,
        estado: filtersHook.filters.estado,
    };

    return {
        ...filtersHook,
        filters: filtersHook.filters,
        debouncedFilters,
    };
};
