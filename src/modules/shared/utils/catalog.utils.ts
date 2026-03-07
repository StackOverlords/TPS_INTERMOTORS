import type {
  CatalogOptionList,
  CatalogResponseOptions,
} from "../types/catalog.types";

/**
 * Convertir tipos en opciones para selects
 */
export function mapCatalogToOptions(
  catalog: CatalogResponseOptions,
): CatalogOptionList {
  return Object.entries(catalog).map(([code, label]) => ({
    code,
    label,
  }));
}
