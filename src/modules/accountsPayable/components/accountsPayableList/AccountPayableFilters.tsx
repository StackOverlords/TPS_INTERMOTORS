import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
// import { PaginatedCombobox } from "@/components/common/paginatedCombobox";
import { useFilterNavigation } from "@/hooks/keyBindings/useFilterNavigation";
import { useSaleCustomers } from "@/modules/sales/hooks/useSaleCustomers";
import { CalendarDays, Search } from "lucide-react";
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

    // Calcular si se están usando fechas
    const hasDateFilters = filters.fecha_inicio || filters.fecha_fin;

    return (
        <div ref={containerRef} className="space-y-2">
            {/* Indicador de filtro de fechas activo */}
            {/* {hasDateFilters && (
                <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        Filtrando por fecha: {filters.fecha_inicio ? new Date(filters.fecha_inicio).toLocaleDateString('es-ES') : '...'} - {filters.fecha_fin ? new Date(filters.fecha_fin).toLocaleDateString('es-ES') : '...'}
                    </Badge>
                    <span className="text-gray-500 text-[10px]">(Por defecto: últimos 3 meses)</span>
                </div>
            )} */}

            {/* Primera fila: Filtros principales */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {/* Nro. Venta */}
                <div className="space-y-0.5" data-filter="nro_venta">
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
                            const numValue = value ? Number(value) : undefined;
                            updateFilter(
                                "cliente",
                                (value === "all" || !numValue || isNaN(numValue)) ? undefined : numValue
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
                                (value === "all" || !value || value === "") ? undefined : (value as typeof filters.tipo_pago)
                            );
                        }}
                        options={paymentTypeOptions}
                        optionTag="label"
                        enableAllOption={false}
                        clearOnEmpty={true}
                    />
                </div>

                {/* Estado de Pago */}
                <div className="space-y-0.5" data-filter="estado_pago">
                    <Label className="text-xs">Estado Pago</Label>
                    <ComboboxSelect
                        value={filters.estado_pago ?? ""}
                        onChange={(value) => {
                            updateFilter(
                                "estado_pago",
                                (!value || value === "") ? undefined : (value as typeof filters.estado_pago)
                            );
                        }}
                        options={[
                            { id: "DEUDA", label: "Con Deuda" },
                            { id: "PAGADO", label: "Pagado" },
                        ]}
                        optionTag="label"
                        enableAllOption={false}
                        clearOnEmpty={true}
                        placeholder="Sin filtro"
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
            </div>

            {/* Segunda fila: Filtros condicionales y botón buscar */}
            <div className="flex flex-wrap items-end gap-2">
                {/* Tipo de Vencimiento */}
                <div className="space-y-0.5" data-filter="tipo_vencimiento">
                    <div className="flex items-center gap-1">
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
                    </div>
                    <ComboboxSelect
                        disabled={!filters.condicion_vencimiento}
                        value={filters.tipo_vencimiento ?? "all"}
                        onChange={(value) => {
                            updateFilter(
                                "tipo_vencimiento",
                                (value === "all" || !value || value === "") ? undefined : (value as typeof filters.tipo_vencimiento)
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
                    <div className="flex items-center gap-1">
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
                    </div>
                    <div className="flex gap-1">
                        <div className="w-32">
                            <ComboboxSelect
                                disabled={!filters.condicion_fecha_especifica}
                                value={filters.fecha_vencimiento_regla}
                                onChange={(value) => {
                                    updateFilter(
                                        "fecha_vencimiento_regla",
                                        (!value || value === "") ? undefined : (value as "=" | ">=" | "<=")
                                    );
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
                            className="h-7 text-xs w-36"
                        />
                    </div>
                </div>

                {/* Botón Buscar (solo en modo manual) */}
                {searchMode === "manual" && (
                    <div className="flex items-end">
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
