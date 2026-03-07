import { useFiltersManagement } from "@/modules/shared/hooks/useFiltersManagement";
import type { EmployeeFilters } from "../../types/employee.types";

export const useEmployeeFilters = () => {
  return useFiltersManagement<EmployeeFilters>(
    {
      pagina: 1,
      pagina_registros: 25,
    },
    // Sin debounce porque el trigger es manual (applyFilters)
    { debounceMs: 300 },
  );
};
