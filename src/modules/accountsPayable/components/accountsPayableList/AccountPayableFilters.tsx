import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { useFilterNavigation } from "@/hooks/keyBindings/useFilterNavigation";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useMemo } from "react";
import { usePaymentTypes } from "../../hooks/queries/usePaymentTypes";
import { useTermTypes } from "../../hooks/queries/useTermTypes";
import type { useAccountPayableFilters } from "../../hooks/useAccountPayableFilters";

interface AccountPayableFiltersProps {
    filters: ReturnType<typeof useAccountPayableFilters>["filters"];
    updateFilter: ReturnType<typeof useAccountPayableFilters>["updateFilter"];
    searchMode: "realtime" | "manual";
    handleManualSearch: () => void;
}

const AccountPayableFilters: React.FC<AccountPayableFiltersProps> = ({
    filters,
    updateFilter,
    searchMode,
    handleManualSearch,
}) => {
    const { containerRef } = useFilterNavigation();

    // Obtener tipos de pago y vencimiento desde el API
    const { data: paymentTypesData } = usePaymentTypes();
    const { data: termTypesData } = useTermTypes();

    // Convertir los objetos del API a formato de opciones para ComboboxSelect
    const paymentTypeOptions = useMemo(() => {
        if (!paymentTypesData) return [];
        return Object.entries(paymentTypesData).map(([id, label]) => ({
            id,
            label: label as string,
        }));
    }, [paymentTypesData]);

    const termTypeOptions = useMemo(() => {
        if (!termTypesData) return [];
        return Object.entries(termTypesData).map(([id, label]) => ({
            id,
            label: label as string,
        }));
    }, [termTypesData]);

    return (
        <div ref={containerRef}>
            <div className={cn(
                "grid gap-1.5",
                searchMode === "manual"
                    ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8"
                    : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
            )}>
                {/* Nro. Venta */}
                <div className="space-y-0.5" data-filter="nro_venta">
                    <Label className="text-xs">Nro. Venta</Label>
                    <div className="relative">
                        <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                        <Input
                            type="number"
                            placeholder="Nro..."
                            value={filters.nro_venta ?? ""}
                            onChange={(e) =>
                                updateFilter(
                                    "nro_venta",
                                    e.target.value ? Number(e.target.value) : undefined
                                )
                            }
                            className="pl-6 h-7 text-xs"
                        />
                    </div>
                </div>

                {/* ID Cliente */}
                <div className="space-y-0.5" data-filter="cliente">
                    <Label className="text-xs">ID Cliente</Label>
                    <div className="relative">
                        <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                        <Input
                            type="number"
                            placeholder="ID..."
                            value={filters.cliente ?? ""}
                            onChange={(e) =>
                                updateFilter(
                                    "cliente",
                                    e.target.value ? Number(e.target.value) : undefined
                                )
                            }
                            className="pl-6 h-7 text-xs"
                        />
                    </div>
                </div>

                {/* Tipo de Pago */}
                <div className="space-y-0.5" data-filter="tipo_pago">
                    <Label className="text-xs">Tipo Pago</Label>
                    <ComboboxSelect
                        value={filters.tipo_pago ?? "all"}
                        onChange={(value) => {
                            updateFilter(
                                "tipo_pago",
                                value === "all" ? undefined : (value as typeof filters.tipo_pago)
                            );
                        }}
                        options={paymentTypeOptions}
                        optionTag="label"
                        enableAllOption={true}
                    />
                </div>

                {/* Tipo de Vencimiento */}
                <div className="space-y-0.5" data-filter="tipo_vencimiento">
                    <div className="flex items-center space-x-1">
                        <Switch
                            id="condicion-vencimiento"
                            checked={filters.condicion_vencimiento ?? false}
                            onCheckedChange={(checked) => {
                                updateFilter("condicion_vencimiento", checked);
                                if (!checked) {
                                    updateFilter("tipo_vencimiento", undefined);
                                }
                            }}
                            className="scale-[0.65]"
                        />
                        <Label htmlFor="condicion-vencimiento" className="text-[10px]">
                            Vencimiento
                        </Label>
                    </div>
                    <ComboboxSelect
                        disabled={!filters.condicion_vencimiento}
                        value={filters.tipo_vencimiento ?? "all"}
                        onChange={(value) => {
                            updateFilter(
                                "tipo_vencimiento",
                                value === "all" ? undefined : (value as typeof filters.tipo_vencimiento)
                            );
                        }}
                        options={termTypeOptions}
                        optionTag="label"
                        enableAllOption={true}
                    />
                </div>

                {/* Fecha Inicio */}
                <div className="space-y-0.5">
                    <Label className="text-xs">Fecha Inicio</Label>
                    <Input
                        type="date"
                        value={filters.fecha_inicio ?? ""}
                        onChange={(e) =>
                            updateFilter("fecha_inicio", e.target.value || undefined)
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
                            updateFilter("fecha_fin", e.target.value || undefined)
                        }
                        className="h-7 text-xs"
                    />
                </div>

                {/* Botón Buscar (solo en modo manual) */}
                {searchMode === "manual" && (
                    <div className="flex items-end">
                        <Button onClick={handleManualSearch} className="w-full h-7 text-xs px-2">
                            <Search className="size-3" />
                            Buscar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountPayableFilters;
