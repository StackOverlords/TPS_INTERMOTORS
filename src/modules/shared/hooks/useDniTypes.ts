import { useQuery } from "@tanstack/react-query";
import type { CatalogOptionList } from "../types/catalog.types";
import { commonsEmployeesService } from "../services/commonEmployees.service";

export const useDniTypes = () => {
  return useQuery<CatalogOptionList>({
    queryKey: ["dni-types"],
    queryFn: commonsEmployeesService.getDniTypes,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
};
