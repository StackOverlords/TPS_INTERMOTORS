import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/atoms/select";
import { useProviders } from "@/modules/purchases/hooks/useProviders";
import { PAYMENT_TERM_TYPES } from "../../schemas/cxpFilters.schema";
import type { CxPPaginatedFilters } from "../../hooks/queries/useCxPPaginated";
import { Search, X } from "lucide-react";

const FECHA_VENCIMIENTO_REGLAS = {
    ">=": "Desde (≥)",
    "<=": "Hasta (≤)",
    "=": "Igual (=)",
} as const;

interface CxPFiltersProps {
    filters: CxPPaginatedFilters;
    onFilterChange: (key: keyof CxPPaginatedFilters, value: string | number | undefined) => void;
    onSearch: () => void;
    onReset?: () => void;
    searchMode?: "realtime" | "manual";
}

const CxPFilters: React.FC<CxPFiltersProps> = ({
    filters,
    onFilterChange,
    onSearch,
    onReset,
    searchMode = "manual",
}) => {
    const { data: providers = [] } = useProviders();

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {/* Proveedor */}
                <div className="space-y-0.5">
                    <Label className="text-xs">Proveedor</Label>
                    <Select
                        value={filters.proveedor ? String(filters.proveedor) : "all"}
                        onValueChange={(val) =>
                            onFilterChange("proveedor", val === "all" ? undefined : Number(val))
                        }
                    >
                        <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {providers.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                    {p.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Estado de pago */}
                <div className="space-y-0.5">
                    <Label className="text-xs">Estado</Label>
                    <Select
                        value={filters.estado_pago ?? "all"}
                        onValueChange={(val) =>
                            onFilterChange("estado_pago", val === "all" ? undefined : val)
                        }
                    >
                        <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="DEUDA">Con deuda</SelectItem>
                            <SelectItem value="PAGADO">Pagado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Vencimiento */}
                <div className="space-y-0.5">
                    <Label className="text-xs">Vencimiento</Label>
                    <Select
                        value={filters.tipo_vencimiento ?? "all"}
                        onValueChange={(val) =>
                            onFilterChange("tipo_vencimiento", val === "all" ? undefined : val)
                        }
                    >
                        <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {Object.entries(PAYMENT_TERM_TYPES).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Fecha Inicio */}
                <div className="space-y-0.5">
                    <Label className="text-xs">Fecha Inicio</Label>
                    <PopoverDatePicker
                        value={filters.fecha_inicio ?? undefined}
                        onChange={(date) =>
                            onFilterChange("fecha_inicio", date ? format(date, "yyyy-MM-dd") : undefined)
                        }
                        className="h-7 text-xs"
                    />
                </div>

                {/* Fecha Fin */}
                <div className="space-y-0.5">
                    <Label className="text-xs">Fecha Fin</Label>
                    <PopoverDatePicker
                        value={filters.fecha_fin ?? undefined}
                        onChange={(date) =>
                            onFilterChange("fecha_fin", date ? format(date, "yyyy-MM-dd") : undefined)
                        }
                        className="h-7 text-xs"
                    />
                </div>

                {/* Vence — operador */}
                <div className="space-y-0.5">
                    <Label className="text-xs">Vence (fecha exacta)</Label>
                    <Select
                        value={filters.fecha_vencimiento_regla ?? "all"}
                        onValueChange={(val) => {
                            onFilterChange("fecha_vencimiento_regla", val === "all" ? undefined : val);
                            if (val === "all") onFilterChange("fecha_vencimiento", undefined);
                        }}
                    >
                        <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Sin filtro" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Sin filtro</SelectItem>
                            {Object.entries(FECHA_VENCIMIENTO_REGLAS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Vence — fecha */}
                <div className="space-y-0.5">
                    <Label className="text-xs">Fecha vencimiento</Label>
                    <PopoverDatePicker
                        value={filters.fecha_vencimiento ?? undefined}
                        onChange={(date) =>
                            onFilterChange("fecha_vencimiento", date ? format(date, "yyyy-MM-dd") : undefined)
                        }
                        className="h-7 text-xs disabled:opacity-40"
                    />
                </div>

                {/* Acciones */}
                {searchMode === "manual" && (
                    <div className="flex items-end gap-1">
                        <Button onClick={onSearch} className="h-7 text-xs px-3 flex-1">
                            <Search className="size-3 mr-1" />
                            Buscar
                        </Button>
                        {onReset && (
                            <Button
                                variant="outline"
                                onClick={onReset}
                                className="h-7 text-xs px-2"
                                title="Limpiar filtros"
                            >
                                <X className="size-3" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CxPFilters;
