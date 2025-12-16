import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
// import { PaginatedCombobox } from "@/components/common/paginatedCombobox";
import { useFilterNavigation } from "@/hooks/keyBindings/useFilterNavigation";
import { useSaleCustomers } from "@/modules/sales/hooks/useSaleCustomers";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
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
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
    const [debouncedCustomerSearchTerm] = useDebounce<string>(customerSearchTerm, 500);

    // Obtener tipos de pago y vencimiento desde el API
    const { data: paymentTypesData } = usePaymentTypes();
    const { data: termTypesData } = useTermTypes();

    const {
        data: saleCustomersData,
        isLoading: isSaleCustomersLoading
    } = useSaleCustomers(debouncedCustomerSearchTerm);

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
            <div className="flex flex-wrap items-end gap-2">
                {/* Nro. Venta */}
                <div className="space-y-0.5 w-[110px]" data-filter="nro_venta">
                    <Label className="text-xs">Nro. Venta</Label>
                    <div className="relative">
                        <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                        <Input
                            type="string"
                            placeholder="Nro..."
                            value={filters.nro_venta ?? ""}
                            onChange={(e) =>
                                updateFilter(
                                    "nro_venta",
                                    e.target.value ? e.target.value : undefined
                                )
                            }
                            className="pl-6 h-7 text-xs"
                        />
                    </div>
                </div>

                {/* Cliente */}
                <div className="space-y-0.5" data-filter="cliente">
                    <Label className="text-xs">Cliente</Label>
                    {/* <PaginatedCombobox
                        value={filters.cliente}
                        onChange={(value) => updateFilter("cliente", Number(value))}
                        optionsData={saleCustomersData?.data || []}
                        displayField="nombre"
                        isLoading={isSaleCustomersLoading}
                        updatePage={(page) => { console.log("Update page:", page) }}
                        updateSearch={setCustomerSearchTerm}
                        placeholder="Buscar cliente..."
                        metaData={
                            {
                                current_page: saleCustomersData?.meta.current_page || 1,
                                last_page: saleCustomersData?.meta.last_page || 1,
                                total: saleCustomersData?.meta.total || 0,
                                per_page: saleCustomersData?.meta.per_page || 10,
                            }
                        }
                    /> */}
                    <ComboboxSelect
                        value={filters.cliente ?? "all"}
                        onChange={(value) => {
                            updateFilter(
                                "cliente",
                                value === "all" ? undefined : Number(value)
                            );
                        }}
                        options={saleCustomersData?.data.map((customer) => ({
                            id: customer.id.toString(),
                            label: customer.nombre,
                        })) || []}
                        optionTag="label"
                        enableAllOption={false}
                        placeholder="Buscar cliente..."
                        clearOnEmpty={true}
                    />
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
                        enableAllOption={false}
                        clearOnEmpty={true}
                    />
                </div>

                {/* Tipo de Vencimiento */}
                <div className="space-y-0.5" data-filter="tipo_vencimiento">
                    <Switch
                        id="condicion-vencimiento"
                        checked={filters.condicion_vencimiento ?? false}
                        onCheckedChange={(checked) => {
                            updateFilter("condicion_vencimiento", checked);
                        }}
                            className="scale-[0.65]"
                        />
                        <Label htmlFor="condicion-vencimiento" className="text-[10px]">
                            Vencimiento
                        </Label>
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
                        enableAllOption={false}
                        clearOnEmpty={true}
                    />
                </div>

                {/* Fecha Especifica */}
                <div className="space-y-0.5" data-filter="fecha_especifica">
                        <Switch
                            id="condicion-fecha-especifica"
                            checked={filters.condicion_fecha_especifica ?? false}
                            onCheckedChange={(checked) => {
                                updateFilter("condicion_fecha_especifica", checked);
                            }}
                            className="scale-[0.65]"
                        />
                        <Label htmlFor="condicion-fecha-especifica" className="text-[10px]">
                            Fecha Esp.
                        </Label>
                    <div className="flex gap-1">
                        <div className="flex-shrink-0">
                            <ComboboxSelect
                                disabled={!filters.condicion_fecha_especifica}
                                value={filters.fecha_vencimiento_regla}
                                onChange={(value) => {
                                    updateFilter("fecha_vencimiento_regla", value as "=" | ">=" | "<=");
                                }}
                                options={[
                                    { id: "=", label: "Igual" },
                                    { id: ">=", label: "Mayor/Igual" },
                                    { id: "<=", label: "Menor/Igual" },
                                ]}
                                optionTag="label"
                                placeholder="Regla"
                                clearOnEmpty={true}
                            />
                        </div>
                        <Input
                            type="date"
                            disabled={!filters.condicion_fecha_especifica}
                            value={filters.fecha_vencimiento ?? ""}
                            onChange={(e) =>
                                updateFilter("fecha_vencimiento", e.target.value || undefined)
                            }
                            className="h-7 text-xs flex-1 min-w-0"
                        />
                    </div>
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
                <div className="space-y-0.5 ">
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
                    <div className="flex items-end pb-0.5">
                        <Button onClick={handleManualSearch} className="h-7 text-xs px-3">
                            <Search className="size-3 mr-1" />
                            Buscar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountPayableFilters;
