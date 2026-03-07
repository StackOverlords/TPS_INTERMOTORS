/**
 * QuotationSelectorWindow - Ventana Standalone para Selección de Cotizaciones
 */

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { Kbd } from "@/components/atoms/kbd";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";
import { useCustomTable } from "@/hooks/useCustomTable";
import { formatCurrency } from "@/utils/formaters";
import { emitToWindow } from "@/utils/tauriWindows";
import { type ColumnDef } from "@tanstack/react-table";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  Check,
  Clock,
  FileText,
  Phone,
  RefreshCcw,
  Settings,
  Zap,
  PackageSearch,
  Loader2, // ✅ AGREGAR
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QuotationGetAll } from "@/modules/quotations/types/quotationGet.types";
import { useQuotationsPaginated } from "@/modules/quotations/hooks/useQuotationsPaginated";
import { useSalesFilters } from "@/modules/sales/hooks/useSalesFilters";
import { useBranchStore } from "@/states/branchStore";
import TooltipButton from "@/components/common/TooltipButton";
import QuotationsFiltersComponent from "@/modules/quotations/components/quotationList/quotationFilterComponent";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useCommands } from "@/keybindings";
import { useQuotationGetById } from "@/modules/quotations/hooks/useQuotationGetById"; // ✅ AGREGAR

interface WindowConfig {
  windowId: string;
  context: string;
}

const QuotationSelectorWindow: React.FC = () => {
  const currentWindow = getCurrentWebviewWindow();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const tableRef = useRef<HTMLTableElement>(null);

  const config: WindowConfig = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      windowId: params.get("windowId") || "quotation-selector-default",
      context: params.get("context") || "default",
    };
  }, []);

  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // ✅ AGREGAR: Estado para cotización seleccionada
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(
    null
  );

  // ✅ AGREGAR: Query para obtener cotización completa
  const { data: quotationFullData, isLoading: isLoadingQuotation } =
    useQuotationGetById(selectedQuotationId || 0);

  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    setPage,
    applyFilters,
    setPageSize,
    resetFilters,
  } = useSalesFilters(Number(selectedBranchId) || 1);

  const activeFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  const {
    data: quotationData,
    isLoading,
    isFetching,
    isError,
    refetch: refetchQuotations,
  } = useQuotationsPaginated(activeFilters);

  const quotations = quotationData?.data || [];

  // ✅ MODIFICAR: Ahora solo setea el ID
  const handleQuotationSelect = useCallback((quotation: QuotationGetAll) => {
    // Solo setear el ID, el useEffect se encarga del resto
    setSelectedQuotationId(quotation.id);
  }, []);

  // ✅ AGREGAR: useEffect para enviar data completa cuando llegue
  useEffect(() => {
    if (quotationFullData && selectedQuotationId) {
      const sendDataAndClose = async () => {
        showSuccessToast({
          title: "Cotización seleccionada",
          description: `Cotización #${quotationFullData.nro}`,
          duration: 1500,
        });

        // Enviar cotización COMPLETA
        await emitToWindow(
          config.windowId,
          "quotation-selected",
          quotationFullData
        );

        await currentWindow.close();
      };

      sendDataAndClose();
    }
  }, [quotationFullData, selectedQuotationId, config.windowId, currentWindow]);

  const columns = useMemo<ColumnDef<QuotationGetAll>[]>(
    () => [
      {
        accessorKey: "nro_cotizacion",
        header: "Nro. Cotización",
        size: 150,
        enableHiding: false,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5">
            <TooltipWrapper
              tooltipContentProps={{
                align: "start",
              }}
              tooltip={
                <p className="flex gap-1">
                  Presiona <Kbd>enter</Kbd> para seleccionar la cotización
                </p>
              }
            >
              <div className="space-y-1 flex flex-col">
                <span className="font-medium text-foreground">
                  {getValue<string>()}
                </span>
              </div>
            </TooltipWrapper>
          </div>
        ),
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
        size: 140,
        cell: ({ getValue }) => {
          const dateString = getValue<string>();

          try {
            const date = new Date(dateString);
            const isToday =
              format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <div className="text-center text-xs">
                <div
                  className={`font-medium ${isToday ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}
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
        size: 200,
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
                  {(cliente.contacto || cliente.celular) && (
                    <div className="flex items-center gap-1">
                      <Phone className="size-3" />
                      {cliente.celular ? cliente.celular : cliente.contacto}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "responsable",
        header: "Responsable",
        size: 180,
        cell: ({ row }) => {
          const resp = row.original.responsable;
          const nombreCompleto = resp
            ? [resp.nombre, resp.apellido_paterno, resp.apellido_materno]
                .filter(
                  (item) => item && item !== "null" && item !== "undefined"
                )
                .join(" ")
            : "Sin responsable";
          return (
            <div className="space-y-1 flex flex-col">
              <span
                className={`${!resp ? "italic text-muted-foreground" : "font-medium text-foreground"}`}
              >
                {nombreCompleto}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "contexto",
        header: "Contexto",
        size: 120,
        cell: ({ getValue }) => {
          const contexto = getValue<string>();
          const [tipo, categoria] = contexto.split("|");
          return (
            <div className="space-y-1 flex flex-col">
              <Badge variant={"info"} className="text-xs w-max">
                {tipo}
              </Badge>
              <div className="text-xs text-muted-foreground">{categoria}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "anticipo",
        header: "Anticipo",
        size: 100,
        cell: ({ getValue }) => (
          <div className="text-right font-medium">
            {formatCurrency(getValue<number>())}
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        size: 120,
        cell: ({ getValue }) => (
          <div className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(getValue<number>())}
          </div>
        ),
      },
      {
        accessorKey: "vehiculo",
        header: "Vehículo/Motor",
        size: 150,
        cell: ({ getValue }) => {
          const vehiculo = getValue<string | null>();
          return (
            <div
              className={`text-xs truncate ${!vehiculo ? "italic text-muted-foreground " : ""}`}
            >
              {vehiculo || "Sin vehiculo"}
            </div>
          );
        },
      },
      {
        id: "acciones",
        header: "Acción",
        size: 150,
        minSize: 120,
        enableSorting: false,
        cell: ({ row }) => {
          const quotation = row.original;
          // ✅ AGREGAR: Detectar si esta cotización está seleccionada
          const isSelected = selectedQuotationId === quotation.id;

          return (
            <TooltipButton
              onClick={() => handleQuotationSelect(quotation)}
              buttonProps={{
                variant: isSelected ? "secondary" : "default",
                className: "gap-2 w-full",
                disabled:
                  (isLoadingQuotation && isSelected) ||
                  (isLoadingQuotation && !!selectedQuotationId), // ✅ Deshabilitar si está cargando
              }}
              tooltip={
                isSelected
                  ? "Cargando cotización completa..."
                  : "Seleccionar esta cotización"
              }
            >
              {/* ✅ AGREGAR: Mostrar loading si está cargando */}
              {isLoadingQuotation && isSelected ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="truncate">Cargando...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span className="truncate">Seleccionar</span>
                </>
              )}
            </TooltipButton>
          );
        },
      },
    ],
    [handleQuotationSelect, selectedQuotationId, isLoadingQuotation] // ✅ Agregar dependencias
  );

  const { table } = useCustomTable({
    data: quotations,
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: false,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,
    columnResizeMode: "onChange",
    persistenceKey: `quotation-selector-${config.context}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
    hiddenColumns: [],
  });

  const { selectedIndex, setSelectedIndex, isFocused } = useKeyboardNavigation<
    QuotationGetAll,
    HTMLTableElement
  >({
    items: quotations,
    containerRef: tableRef,
    onPrimaryAction: (quotation) => {
      handleQuotationSelect(quotation);
    },
    getItemId: (quotation) => quotation.id,
  });

  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleRowDoubleClick = (quotation: QuotationGetAll) => {
    handleQuotationSelect(quotation);
  };

  const handleClose = async () => {
    await emitToWindow(config.windowId, "window-closed", { canceled: true });
    await currentWindow.close();
  };

  const onPageChange = (page: number) => {
    setPage(page);
  };

  const onShowRowsChange = (rows: number) => {
    setPageSize(rows);
  };

  const handleRefetchQuotations = () => {
    refetchQuotations();
  };

  const toggleShowFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleManualSearch = () => {
    if (searchMode === "manual") {
      applyFilters();
    }
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useCommands(
    {
      "searchFilters.focusSearch": handleManualSearch,
      "forms.reset": handleResetFilters,
    },
    {
      enableOnFormTags: true,
    }
  );

  return (
    <main className="h-full p-2 flex flex-col bg-secondary gap-2">
      {/* Header */}
      <header className="bg-background rounded-lg p-2 border border-border flex-shrink-0 flex flex-col divide-y divide-border gap-1">
        <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap pb-2">
          <div className="flex items-center gap-2 md:gap-4 grow">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-primary">
              Seleccionar Cotización
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
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
                className={`h-3 w-3 ${
                  searchMode === "realtime"
                    ? "text-yellow-500"
                    : "text-gray-500"
                }`}
              />
              {searchMode === "realtime" ? "Tiempo real" : "Manual"}
            </Button>

            <TooltipButton
              onClick={handleRefetchQuotations}
              buttonProps={{
                className: "w-8",
                disabled: isFetching,
              }}
              tooltip="Recargar cotizaciones"
            >
              <RefreshCcw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </TooltipButton>

            <Button variant={"outline"} onClick={toggleShowFilters}>
              {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </Button>

            <Button onClick={handleResetFilters}>
              <PackageSearch className="h-4 w-4" />
              Nueva búsqueda
            </Button>
          </div>
        </section>
        {showFilters && (
          <>
            <QuotationsFiltersComponent
              filters={filters}
              updateFilter={updateFilter}
              handleManualSearch={handleManualSearch}
              searchMode={searchMode}
            />
          </>
        )}
      </header>

      <div className="bg-background rounded-lg border border-border flex-1 min-h-0">
        <div className="h-full flex flex-col">
          {/* Results Info */}
          <div className="p-2 text-sm text-foreground border-b border-border flex-shrink-0 flex items-center justify-between">
            {quotations.length > 0 ? (
              (() => {
                const pagina = filters.pagina ?? 1;
                const porPagina = filters.pagina_registros ?? 1;
                const inicio = (pagina - 1) * porPagina + 1;
                const fin = pagina * porPagina;
                return `Mostrando ${inicio} - ${fin} de ${quotationData?.meta?.total ?? 0} cotizaciones`;
              })()
            ) : (
              <span>Cargando...</span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 max-h-96 overflow-y-auto border border-border"
              >
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuItem
                      key={column.id}
                      className="flex items-center space-x-2 cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                      onClick={() =>
                        column.toggleVisibility(!column.getIsVisible())
                      }
                    >
                      <Checkbox
                        className="border border-input"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      />
                      <span className="flex-1">
                        {typeof column.columnDef.header === "string"
                          ? column.columnDef.header
                          : column.id}
                      </span>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tabla con scroll */}
          <div className="flex-1 min-h-0">
            <CustomizableTable
              table={table}
              isError={isError}
              isFetching={isFetching}
              isLoading={isLoading}
              errorMessage="Ocurrió un error al cargar las cotizaciones"
              rows={filters.pagina_registros}
              noDataMessage="No se encontraron cotizaciones"
              keyboardNavigationEnabled={true}
              enableColumnReordering={true}
              tableRef={tableRef}
              enableSorting={false}
              selectedRowIndex={selectedIndex}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              focused={isFocused}
            />
          </div>

          {/* Paginación */}
          {(quotationData?.data?.length ?? 0) > 0 && (
            <Pagination
              currentPage={filters.pagina || 1}
              onPageChange={onPageChange}
              totalData={quotationData?.meta?.total || 1}
              onShowRowsChange={onShowRowsChange}
              showRows={filters.pagina_registros}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default QuotationSelectorWindow;
