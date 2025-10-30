import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { useCategoriesWithSubcategories } from "@/modules/shared/hooks/useCategories";
import { useCommonBrands } from "@/modules/shared/hooks/useCommonBrands";
import { Search } from "lucide-react";
import type { useProductFilters } from "../../hooks/useProductFilters";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useCommonSubcategories } from "@/modules/shared/hooks/useCommonSubcategories";
import { useFilterNavigation } from "@/hooks/keyBindings/useFilterNavigation";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";

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
            <div className={cn(
                "grid grid-cols-2 gap-2",
                searchMode === 'manual' ? 'md:grid-cols-5' : 'md:grid-cols-4'
            )}>
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

                {searchMode === 'manual' && (
                    <div className="flex items-end justify-end">
                        <Button
                            onClick={handleManualSearch}
                            className="w-ful"
                        >
                            <Search className="size-4" />
                            Buscar
                        </Button>
                    </div>
                )}

                {
                    showSubcategories && (
                        <>
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

                    )
                }
            </div>
            {/* Botón de búsqueda solo visible en modo manual */}
            {/* <div className="mt-2 flex justify-end gap-2">
                    {searchMode === 'manual' && (
                        <Button
                            onClick={handleManualSearch}
                            className="w-full sm:w-auto"
                        >
                            <Search className="size-4" />
                            Buscar
                        </Button>
                    )}
                </div> */}
        </div>
    );
}

export default ProductFilters;