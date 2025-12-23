import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
// import { useFilterNavigation } from "@/hooks/keyBindings/useFilterNavigation";
import { useViewConfig } from "@/hooks/useViewConfig"; // ← NUEVO
import { cn } from "@/lib/utils";
import { useCategoriesWithSubcategories } from "@/modules/shared/hooks/useCategories";
import { useCommonBrands } from "@/modules/shared/hooks/useCommonBrands";
import { useCommonSubcategories } from "@/modules/shared/hooks/useCommonSubcategories";
import { Search } from "lucide-react";
import type { useProductFilters } from "../../hooks/useProductFilters";
import { useRef } from "react";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { useCommands } from "@/keybindings";

interface ProductFiltersProps {
  filters: ReturnType<typeof useProductFilters>["filters"]
  updateFilter: ReturnType<typeof useProductFilters>["updateFilter"]
  showSubcategories: boolean
  searchMode: 'realtime' | 'manual'
  handleManualSearch: () => void
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  updateFilter,
  showSubcategories,
  searchMode,
  handleManualSearch,
}) => {
  // ✅ NUEVO: Hook de configuración
  const { isFeatureEnabled } = useViewConfig('products-list');

  const { data: categoriesData } = useCategoriesWithSubcategories();
  const { data: brandsData } = useCommonBrands()
  const {
    data: subcategoriesData
  } = useCommonSubcategories({
    categoria: filters.categoria,
    enabled: !!filters.categoria
  })
  
  // const { containerRef } = useFilterNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  useFormEnterNavigation({
    containerRef: containerRef,
    excludeSelectors: ['.no-enter-nav','.columns-button','[name="btn-chvron-right"]'],
  })
  return (
    <div ref={containerRef}>
      <div className={cn(
        "grid grid-cols-2 gap-2",
        searchMode === 'manual' ? 'md:grid-cols-6' : 'md:grid-cols-5'
      )}>
        {/* Filtro de Categoría */}
        {isFeatureEnabled('categoryFilter') && (
          <div data-filter="categoria">
            <Label>Categorias</Label>
            <ComboboxSelect
              value={filters.categoria}
              onChange={(value) => {
                const parsedValue = value === "all" ? undefined : Number(value);
                updateFilter("subcategoria", undefined);
                updateFilter("categoria", parsedValue);
              }}
              options={(categoriesData || []).map((cat) => ({
                id: String(cat.id),
                categoria: cat.categoria,
              }))}
              optionTag={"categoria"}
              clearOnEmpty={true}
            />
          </div>
        )}

        {/* Filtro de Descripción */}
        {isFeatureEnabled('searchBar') && (
          <div className="space-y-2" data-filter="descripcion">
            <Label>Descripción</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por descripcion..."
                value={filters.descripcion}
                onChange={(e) => updateFilter("descripcion", e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        )}

        {/* Código OEM */}
        {isFeatureEnabled('searchBar') && (
          <div className="space-y-2" data-filter="codigo_oem">
            <Label>Código OEM</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="11122-10040-D..."
                value={filters.codigo_oem}
                onChange={(e) => updateFilter("codigo_oem", e.target.value)}
                className="pl-10 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Código UPC */}
        {isFeatureEnabled('searchBar') && (
          <div className="space-y-2" data-filter="codigo_upc">
            <Label>Código UPC</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="11122-10040..."
                value={filters.codigo_upc}
                onChange={(e) => updateFilter("codigo_upc", e.target.value)}
                className="pl-10 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Filtro de Marca */}
        {isFeatureEnabled('brandFilter') && (
          <div className="space-y-2" data-filter="marca">
            <Label>Marca</Label>
            <ComboboxSelect
              value={filters.marca}
              onChange={(value) => {
                updateFilter("marca", value === "all" ? "" : value);
              }}
              options={(brandsData || []).map((brand) => ({
                id: brand.id,
                marca: brand.marca,
              }))}
              optionTag={"marca"}
              enableAllOption={false}
              clearOnEmpty={true}
            />
          </div>
        )}

        {/* Botón de Búsqueda Manual */}
        {searchMode === 'manual' && (
          <div className="flex items-end justify-end">
            <Button
              onClick={handleManualSearch}
              className="w-full"
            >
              <Search className="size-4" />
              Buscar
            </Button>
          </div>
        )}

        {/* Filtros Avanzados */}
        {showSubcategories && isFeatureEnabled('advancedFilters') && (
          <>
            {/* Subcategorías */}
            <div>
              <Label>Subcategorias</Label>
              <ComboboxSelect
                disabled={filters.categoria === undefined}
                value={filters.subcategoria !== undefined ? String(filters.subcategoria) : "all"}
                onChange={(value) => {
                  const parsedValue = value === "all" ? undefined : Number(value);
                  updateFilter("subcategoria", parsedValue);
                }}
                options={subcategoriesData || []}
                optionTag={"subcategoria"}
                enableAllOption={true}
              />
            </div>

            {/* Medida */}
            <div className="space-y-2">
              <Label>Medida</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="11X6X40.6..."
                  value={filters.medida}
                  onChange={(e) => updateFilter("medida", e.target.value)}
                  className="pl-10 font-mono text-xs"
                />
              </div>
            </div>

            {/* Número de Motor */}
            <div className="space-y-2">
              <Label>Número de Motor</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="1ZZ-FE..."
                  value={filters.nro_motor}
                  onChange={(e) => updateFilter("nro_motor", e.target.value)}
                  className="pl-10 font-mono text-xs"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProductFilters;