import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { useCategoriesWithSubcategories } from "@/modules/shared/hooks/useCategories";
import { useCommonBrands } from "@/modules/shared/hooks/useCommonBrands";
import { Search } from "lucide-react";
import type { useProductFilters } from "../../hooks/useProductFilters";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useCommonSubcategories } from "@/modules/shared/hooks/useCommonSubcategories";
import { useFilterNavigation } from "@/hooks/keyBindings/useFilterNavigation";

interface ProductFiltersProps {
    filters: ReturnType<typeof useProductFilters>["filters"]
    updateFilter: ReturnType<typeof useProductFilters>["updateFilter"]
}
const ProductFilters: React.FC<ProductFiltersProps> = ({
    filters,
    updateFilter,
}) => {
    const { data: categoriesData } = useCategoriesWithSubcategories();
    const { data: brandsData } = useCommonBrands()
    const {
        data: subcategoriesData
    } = useCommonSubcategories({
        categoria: filters.categoria,
        enabled: !!filters.categoria
    })

    const { containerRef } = useFilterNavigation();

    return (
        <div ref={containerRef}>
            {/* Búsquedas individuales */}
            <div className="p-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                            enableAllOption={true}
                        />
                    </div>

                    <div className="space-y-2" data-filter="descripcion">
                        <Label>Buscar por Descripción</Label>
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

                    <div className="space-y-2" data-filter="codigo_oem">
                        <Label>Buscar Código OEM</Label>
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

                    <div className="space-y-2" data-filter="codigo_upc">
                        <Label>Buscar Código UPC</Label>
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
                </div>
            </div>

            {/* Filters */}
            <div className="px-2 pb-2 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

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

                    <div>
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
                            enableAllOption={true}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Buscar Medida</Label>
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

                    <div className="space-y-2">
                        <Label>Buscar Número de Motor</Label>
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
                </div>
            </div>
        </div>
    );
}

export default ProductFilters;