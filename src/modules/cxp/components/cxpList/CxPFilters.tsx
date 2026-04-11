import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Search } from "lucide-react";
import type { CxPPaginatedFilters } from "../../hooks/queries/useCxPPaginated";

interface CxPFiltersProps {
    filters: CxPPaginatedFilters;
    onFilterChange: (key: keyof CxPPaginatedFilters, value: string | number | undefined) => void;
    onSearch: () => void;
    searchMode?: "realtime" | "manual";
}

const CxPFilters: React.FC<CxPFiltersProps> = ({
    filters,
    onFilterChange,
    onSearch,
    searchMode = "manual",
}) => {
    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {/* Fecha Inicio */}
                <div className="space-y-0.5">
                    <Label className="text-xs">Fecha Inicio</Label>
                    <Input
                        type="date"
                        value={filters.fecha_inicio ?? ""}
                        onChange={(e) =>
                            onFilterChange("fecha_inicio", e.target.value || undefined)
                        }
                        className="h-7 text-xs"
                    />
                </div>

                {/* Fecha Fin */}
                <div className="space-y-0.5">
                    <Label className="text-xs">Fecha Fin</Label>
                    <Input
                        type="date"
                        value={filters.fecha_fin ?? ""}
                        onChange={(e) =>
                            onFilterChange("fecha_fin", e.target.value || undefined)
                        }
                        className="h-7 text-xs"
                    />
                </div>

                {/* Botón Buscar */}
                {searchMode === "manual" && (
                    <div className="flex items-end">
                        <Button onClick={onSearch} className="h-7 text-xs px-3">
                            <Search className="size-3 mr-1" />
                            Buscar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CxPFilters;
