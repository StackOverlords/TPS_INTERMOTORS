import { useQuery } from "@tanstack/react-query";
import type { CatalogOptionList } from "../types/catalog.types";
import { commonsEmployeesService } from "../services/commonEmployees.service";

export const useGenderTypes = () => {
  return useQuery<CatalogOptionList>({
    queryKey: ["gender-types"],
    queryFn: commonsEmployeesService.getGenderTypes,
    staleTime: Infinity, // nunca se considera stale
    gcTime: 1000 * 60 * 60 * 24, // se elimina del cache si no se usa en 24h
  });
};
