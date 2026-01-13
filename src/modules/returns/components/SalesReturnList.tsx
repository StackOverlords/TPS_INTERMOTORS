import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import { formatCurrency } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  Clock,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBranchStore } from "@/states/branchStore";
import type { SaleGetAll } from "@/modules/sales/types/salesGetResponse";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { Kbd } from "@/components/atoms/kbd";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSalesFilters } from "@/modules/sales/hooks/useSalesFilters";
import { useSalesPaginated } from "@/modules/sales/hooks/useSalesPaginated";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { useSaleCustomers } from "@/modules/sales/hooks/useSaleCustomers";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import type { SalesFilters } from "@/modules/sales/types/salesFilters";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { useCommands } from "@/keybindings";
import { ComboboxSelect } from "@/components/common/SelectCombobox";

type BaseWithId = {
  sale_id: number;
  almacen_out_id: number | null;
};

interface SaleReturnListProps<T extends BaseWithId> {
  selectedSales: T[];
  onSaleSelect: (sale: SaleGetAll) => void;
  defaultSearchMode?: "realtime" | "manual";
  onlySelectWithStock?: boolean;
  savedFilters?: Partial<SalesFilters>;
  onSavedFiltersChange?: (filters: Partial<SalesFilters>) => void;
  onResetSavedFilters?: () => void;
}

function SaleReturnList<T extends BaseWithId>({
  selectedSales,
  onSaleSelect,
  defaultSearchMode = "manual",
  onlySelectWithStock = false,
  savedFilters,
  onSavedFiltersChange,
  onResetSavedFilters,
}: SaleReturnListProps<T>) {
  const { selectedBranchId } = useBranchStore();
  const user = authSDK.getCurrentUser();

  const [searchMode, setSearchMode] = useState<"realtime" | "manual">(
    defaultSearchMode
  );
  const [dateError, setDateError] = useState<string | null>(null);
  const hasLoadedFilters = useRef(false);

  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    setPage,
    resetFilters,
    applyFilters,
    setPageSize,
    setFilters,
  } = useSalesFilters(Number(selectedBranchId));

  const { data: saleCustomersData } = useSaleCustomers();

  // 🔥 Cargar filtros guardados INMEDIATAMENTE
  useEffect(() => {
    if (savedFilters && !hasLoadedFilters.current) {
      setFilters((prev) => ({
        ...prev,
        ...savedFilters,
        pagina: 1,
        sucursal: Number(selectedBranchId),
      }));
      hasLoadedFilters.current = true;
    }
  }, [savedFilters]); // Solo al montar

  useEffect(() => {
    if (hasLoadedFilters.current && searchMode === "manual") {
      const timer = setTimeout(() => {
        applyFilters();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [hasLoadedFilters.current]);

  const activeFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  const {
    data: salesData,
    isLoading,
    isError,
    isFetching,
  } = useSalesPaginated(activeFilters);

  const sales = salesData?.data || [];
  const totalSales = salesData?.meta?.total || 0;

  const isSaleSelected = useCallback(
    (saleId: number) => {
      const item = selectedSales.find((s) => s.almacen_out_id === saleId);

      return {
        isSelected: !!item,
        item,
      };
    },
    [selectedSales]
  );

  const handleManualSearch = () => {
    if (searchMode === "manual") {
      applyFilters();
    }

    if (onSavedFiltersChange) {
      onSavedFiltersChange(filters);
    }
  };

  const handleClearFilters = () => {
    resetFilters();
    if (onResetSavedFilters) {
      onResetSavedFilters();
    }
  };

  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));
  };

  const columns = useMemo<ColumnDef<SaleGetAll>[]>(
    () => [
      {
        accessorKey: "nro_venta",
        header: "Nro. Venta",
        size: 140,
        minSize: 110,
        enableHiding: false,
        cell: ({ row, getValue }) => {
          const id = row.original.id;
          const { isSelected } = isSaleSelected(id);
          return (
            <div className="flex justify-between gap-1.5">
              <TooltipWrapper
                tooltipContentProps={{
                  align: "start",
                }}
                tooltip={
                  <p className="flex gap-1">
                    Presiona <Kbd>enter</Kbd> para ver los detalles de la venta
                  </p>
                }
              >
                <div className="space-y-1 flex flex-col">
                  <span className="font-medium text-foreground">
                    {getValue<string>()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ID: {id}
                  </span>
                </div>
              </TooltipWrapper>
              {isSelected && (
                <div className="flex items-start">
                  <Badge className="text-[10px] px-1 " variant={"accent"}>
                    Seleccionado
                  </Badge>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => {
          const dateString = getValue<string>();

          try {
            const date = new Date(dateString);
            const isToday =
              format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <div className="text-center text-xs">
                <div
                  className={`font-medium ${isToday ? "text-blue-600" : "text-foreground"}`}
                >
                  {format(date, "dd/MM/yyyy", { locale: es })}
                </div>
                <div className="text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="size-3" />
                  {format(date, "HH:mm", { locale: es })}
                </div>
              </div>
            );
          } catch {
            return (
              <span className="text-xs text-muted-foreground">
                {dateString}
              </span>
            );
          }
        },
      },
      {
        accessorKey: "cliente",
        header: "Cliente",
        size: 250,
        minSize: 200,
        cell: ({ row }) => {
          const cliente = row.original.cliente;
          return (
            <div className="space-y-1 flex flex-col">
              <span
                className={`${!cliente ? "italic text-muted-foreground" : "font-medium text-foreground"}`}
              >
                {cliente?.cliente || "Sin cliente"}
              </span>
              {cliente && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {cliente.nit && <div>NIT: {cliente.nit}</div>}
                  {cliente.contacto && (
                    <div className="flex items-center gap-1">
                      <Phone className="size-3" />
                      {cliente.contacto}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "contexto",
        header: "Contexto",
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => {
          const contexto = getValue<string>();
          const [tipo, categoria] = contexto.split("|");
          return (
            <div className="space-y-1 flex flex-col">
              <Badge variant={"info"} className="text-[10px] w-max">
                {tipo}
              </Badge>
              <div className="text-xs text-muted-foreground">{categoria}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "total",
        header: "Total",
        size: 120,
        minSize: 100,
        cell: ({ getValue }) => (
          <div className="text-right font-medium text-green-600">
            {formatCurrency(getValue<number>())}
          </div>
        ),
      },
      {
        accessorKey: "comprobantes",
        header: "Comprobantes",
        size: 140,
        minSize: 120,
        cell: ({ getValue }) => {
          const comprobantes = getValue<string>();

          if (
            !comprobantes ||
            comprobantes.trim() === "" ||
            comprobantes === "|"
          ) {
            return (
              <div className="text-center">
                <span className="text-muted-foreground italic text-xs">
                  Sin comprobantes
                </span>
              </div>
            );
          }

          const [comprobante1, comprobante2] = comprobantes
            .split("|")
            .map((comp) => comp.trim())
            .filter((comp) => comp !== "");

          return (
            <div className="flex flex-col space-y-0.5 text-xs text-foreground items-center">
              {comprobante1 && (
                <Badge
                  variant={"secondary"}
                  className="flex justify-center w-full text-[10px] rounded py-0.5"
                >
                  {comprobante1}
                </Badge>
              )}
              {comprobante2 && (
                <Badge
                  variant={"secondary"}
                  className="flex justify-center w-full text-[10px] rounded py-0.5"
                >
                  {comprobante2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        size: 90,
        cell: ({ row }) => {
          const sale = row.original;
          return (
            <Button
              type="button"
              size="sm"
              variant={"default"}
              onClick={() => onSaleSelect(sale)}
              className="h-7 text-xs"
            >
              <Plus className="size-3" />
              Agregar
            </Button>
          );
        },
      },
    ],
    [onSaleSelect, onlySelectWithStock, isSaleSelected]
  );

  const { table } = useCustomTable({
    data: sales,
    columns,

    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,

    columnResizeMode: "onChange",

    persistenceKey: `returns-select-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleShowRowsChange = (rows: number) => {
    setPageSize(rows);
  };

  const formatDateSafe = (date: Date): string => {
    try {
      return format(date, "yyyy-MM-dd");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const handleFechaInicioChange = (date: Date | undefined) => {
    setDateError(null);

    if (date) {
      if (filters.fecha_fin && date > filters.fecha_fin) {
        setDateError(
          "La fecha de inicio no puede ser posterior a la fecha de fin"
        );
        return;
      }
    }

    updateFilter("fecha_inicio", date ? formatDateSafe(date) : undefined);
  };

  const handleFechaFinChange = (date: Date | undefined) => {
    setDateError(null);

    if (date) {
      if (filters.fecha_inicio && date < filters.fecha_inicio) {
        setDateError(
          "La fecha de fin no puede ser anterior a la fecha de inicio"
        );
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        setDateError("No se pueden seleccionar fechas futuras");
        return;
      }
    }

    updateFilter("fecha_fin", date ? formatDateSafe(date) : undefined);
  };

  useFormEnterNavigation({
    submitOnLastField: false,
    excludeSelectors: [
      ".no-enter-nav",
      ".columns-button",
      ".toggle-mode",
      ".reload-button",
      ".switch-button",
    ],
    enabled: true,
  });

  useCommands({
    "searchFilters.focusSearch": handleManualSearch,
    "forms.reset": handleClearFilters,
  });

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-2 border-b border-border space-y-1">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-primary">
              Buscar Ventas
            </h3>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={toggleSearchMode}
              className="text-xs h-7"
              title={
                searchMode === "realtime"
                  ? "Cambiar a búsqueda manual"
                  : "Cambiar a búsqueda en tiempo real"
              }
            >
              <Zap
                className={`h-3 w-3 ${searchMode === "realtime" ? "text-yellow-500" : "text-gray-500"}`}
              />
              {searchMode === "realtime" ? "Tiempo real" : "Manual"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Limpiar
            </Button>
            {searchMode === "manual" && (
              <Button
                type="button"
                size="sm"
                onClick={handleManualSearch}
                className="h-7 text-xs"
              >
                <Search className="h-3 w-3 mr-1" />
                Buscar
              </Button>
            )}
          </div>
        </header>

        <section className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            <div className="space-y-2">
              <Label>Nro. de Venta</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="number"
                  placeholder="Ej: 2054"
                  value={filters.codigo_interno ?? ""}
                  onChange={(e) =>
                    updateFilter(
                      "codigo_interno",
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  className="pl-10 font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <ComboboxSelect
                value={filters.cliente}
                onChange={(value) =>
                  updateFilter(
                    "cliente",
                    value && typeof value === "string"
                      ? parseInt(value, 10)
                      : undefined
                  )
                }
                options={saleCustomersData?.data || []}
                enableAllOption={false}
                optionTag="nombre"
                allowClear={true}
                clearOnEmpty={true}
              />
            </div>
            <div className="space-y-2">
              <Label>Código OEM</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="11122-10040-D..."
                  value={filters.codigo_oem_producto}
                  onChange={(e) =>
                    updateFilter("codigo_oem_producto", e.target.value)
                  }
                  className="pl-10 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Desde</Label>
              <div className="flex gap-2">
                <PopoverDatePicker
                  value={filters.fecha_inicio}
                  onChange={(date) => handleFechaInicioChange(date)}
                  hasError={dateError}
                  disabled={(date) => {
                    // const today = new Date();
                    // today.setHours(0, 0, 0, 0);

                    const fechaFin = filters.fecha_fin
                      ? new Date(filters.fecha_fin)
                      : undefined;
                    if (fechaFin && date > fechaFin) return true;
                    return false;
                  }}
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Hasta</Label>
              <div className="flex gap-2">
                <PopoverDatePicker
                  value={filters.fecha_fin}
                  onChange={(date) => handleFechaFinChange(date)}
                  hasError={dateError}
                  disabled={(date) => {
                    // const today = new Date();
                    // today.setHours(0, 0, 0, 0);
                    // if (date > today) return true;

                    const fechaInicio = filters.fecha_inicio
                      ? new Date(filters.fecha_inicio)
                      : undefined;
                    if (fechaInicio && date < fechaInicio) return true;

                    return false;
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 items-end">
              <Button
                variant="outline"
                type="button"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastWeek = new Date(today);
                  lastWeek.setDate(today.getDate() - 7);

                  setDateError(null);
                  updateFilter("fecha_inicio", formatDateSafe(lastWeek));
                  updateFilter("fecha_fin", formatDateSafe(today));
                }}
                className="text-xs"
              >
                Última semana
              </Button>

              <Button
                variant="outline"
                type="button"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today);
                  lastMonth.setMonth(today.getMonth() - 1);

                  setDateError(null);
                  updateFilter("fecha_inicio", formatDateSafe(lastMonth));
                  updateFilter("fecha_fin", formatDateSafe(today));
                }}
                className="text-xs"
              >
                Último mes
              </Button>
            </div>
          </div>

          {dateError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{dateError}</span>
            </div>
          )}
        </section>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-auto px-2">
          <CustomizableTable
            table={table}
            isLoading={isLoading}
            isError={isError}
            isFetching={isFetching}
            rows={filters.pagina_registros}
            errorMessage="Ocurrió un error al cargar los productos"
            noDataMessage={
              searchMode === "manual"
                ? 'Haz clic en "Buscar" para ver los productos'
                : "No se encontraron productos"
            }
          />
        </div>
      </div>

      {sales.length > 0 && (
        <div className="flex-shrink-0 border-t border-border bg-card">
          <Pagination
            currentPage={filters.pagina}
            onPageChange={handlePageChange}
            totalData={totalSales}
            onShowRowsChange={handleShowRowsChange}
            showRows={filters.pagina_registros}
          />
        </div>
      )}
    </div>
  );
}

export default SaleReturnList;
