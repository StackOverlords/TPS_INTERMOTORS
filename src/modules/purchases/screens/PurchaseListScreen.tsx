import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { Input } from "@/components/atoms/input";
import { Kbd } from "@/components/atoms/kbd";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import TooltipButton from "@/components/common/TooltipButton";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { formatCell } from "@/utils/formatCell";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Clock,
  Edit,
  Eye,
  // FileText,
  // Filter,
  Loader2,
  MoreVertical,
  PackageSearch,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
  // Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
// import { useNavigate } from 'react-router';
import DeletePurchaseDialog from "../components/DeletePurchaseDialog";
import PurchaseFilters from "../components/purchaseList/PurchaseFilters";
import { usePurchaseDelete } from "../hooks/usePurchaseDelete";
import { usePurchaseFilters } from "../hooks/usePurchaseFilters";
import { usePurchasesPaginated } from "../hooks/usePurchasesPaginated";
import type { PurchaseGet } from "../types/PurchaseGet";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";
import { useCommands } from "@/keybindings";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { formatColumnNumber } from "@/utils/formaters";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PurchaseListScreen = () => {
  const [isInfiniteScroll, setIsInfiniteScroll] = useState(false);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  // const navigate = useNavigate();
  const user = authSDK.getCurrentUser();
  const tableRef = useRef<HTMLTableElement>(null);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const { navigateWithTab } = useTabNavigation();
  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    setPage,
    resetFilters,
    applyFilters,
    setPageSize,
  } = usePurchaseFilters(Number(selectedBranchId) || 1);

  // Determinar qué filtros usar según el modo
  const activeFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  const {
    data: purchaseData,
    isLoading,
    error,
    isFetching,
    isError,
    refetch: refetchPurchases,
    isRefetching: isRefetchingPurchases,
  } = usePurchasesPaginated(activeFilters);

  const [purchases, setPurchases] = useState<PurchaseGet[]>([]);

  useEffect(() => {
    if (!purchaseData?.data || error || isFetching) return;

    if (isInfiniteScroll && filters.pagina && filters.pagina > 1) {
      setPurchases((prev) => {
        // Evitar duplicados
        const newPurchases = purchaseData.data.filter(
          (newPurchase) =>
            !prev.some(
              (existingPurchase) => existingPurchase.id === newPurchase.id
            )
        );
        return [...prev, ...newPurchases];
      });
    } else {
      setPurchases(purchaseData.data);
    }
  }, [purchaseData?.data, isInfiniteScroll, filters.pagina, error, isFetching]);

  // Manejar búsqueda manual
  const handleManualSearch = () => {
    if (searchMode === "manual") {
      applyFilters();
    }
  };

  // Toggle del modo de búsqueda
  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));
  };

  const handlePurchaseDetail = useCallback(
    (purchase: any) => {
      navigateWithTab(`/dashboard/purchases/${purchase?.id}`, {
        displayCode: formatColumnNumber(purchase?.nro_compra, "-"),
      });
    },
    [navigateWithTab]
  );

  const {
    showDeleteDialog,
    isDeleting,
    initiateDeletion,
    cancelDeletion,
    confirmDeletion,
  } = usePurchaseDelete();

  const handleDeletePurchase = (purchaseId: number) => {
    initiateDeletion(purchaseId);
  };

  const handleConfirmDelete = async () => {
    const success = await confirmDeletion();
    if (success) {
      refetchPurchases();
    }
  };

  const handleEditPurchase = useCallback(
    (purchase: any) => {
      navigateWithTab(`/dashboard/purchases/${purchase.id}/editar`, {
        displayCode: formatColumnNumber(purchase?.nro_compra, "-"),
      });
    },
    [navigateWithTab]
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return formatCell(dateString);
    }
  };

  const getContextColor = (contexto: string) => {
    if (contexto.includes("Credito")) return "warning";
    if (contexto.includes("Contado")) return "success";
    return "secondary";
  };
  // console.log(authSDK.getAccessToken());

  useCommands(
    {
      "searchFilters.focusSearch": handleManualSearch,
      "forms.reset": resetFilters,
    },
    {
      enableOnFormTags: true,
    }
  );
  const columns = useMemo<ColumnDef<PurchaseGet>[]>(
    () => [
      {
        id: "Select",
        header: ({ table }) => (
          <Checkbox
            className="border border-input"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Seleccionar todo"
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <Checkbox
              className="border border-input"
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Seleccionar fila"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: true,
        size: 30,
        minSize: 30,
      },
      {
        accessorKey: "nro_compra",
        header: "Nro.Compra",
        size: 80,
        minSize: 30,
        enableHiding: false,
        cell: ({ row, getValue }) => (
          <div className="flex font-semibold items-center gap-1">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="size-6 px-0"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onKeyDown={(e) => {
                      if (["ArrowUp", "ArrowDown"].includes(e.key)) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  onCloseAutoFocus={(e) => {
                    e.preventDefault();
                  }}
                  align="start"
                  className="w-48"
                >
                  <DropdownMenuItem
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={() => handlePurchaseDetail(row.original)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem
                    onKeyDown={e => e.stopPropagation()}
                    onClick={() => { }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver comprobantes
                  </DropdownMenuItem> */}
                  <ProtectedAction
                    permission="com-edit"
                    roles={["Super Admin", "Administrador", "Vendedor"]}
                    fallback={null}
                  >
                    <DropdownMenuItem
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={() => handleEditPurchase(row.original)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar compra
                    </DropdownMenuItem>
                  </ProtectedAction>
                  <ProtectedAction
                    permission="com-delete"
                    roles={["Super Admin", "Administrador", "Vendedor"]}
                    fallback={null}
                  >
                    <DropdownMenuItem
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={() => handleDeletePurchase(row.original.id)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar compra
                    </DropdownMenuItem>
                  </ProtectedAction>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col">
              <TooltipWrapper
                tooltipContentProps={{
                  align: "start",
                }}
                tooltip={
                  <p className="flex gap-1">
                    Presiona <Kbd>enter</Kbd> para ver los detalles de la compra
                  </p>
                }
              >
                <h3 className="font-medium text-foreground leading-tight hover:underline truncate">
                  {getValue<string>().split("-")[1]}
                </h3>
              </TooltipWrapper>
              {/* <span className="text-xs text-gray-500">
                ID: {row.original.id}
              </span> */}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
        size: 70,
        minSize: 30,
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
        accessorKey: "proveedor",
        header: "Proveedor",
        size: 130,
        minSize: 30,
        cell: ({ row }) => {
          const proveedor = row.original.proveedor;
          if (!proveedor) {
            return (
              <div className="text-muted-foreground italic">Sin proveedor</div>
            );
          }
          return (
            <div className="space-y-1 font-bold">
              <div className="text-blue-600 dark:text-blue-400">
                {proveedor.proveedor}
              </div>
              {/* <div className="text-xs text-gray-800">ID: {proveedor.id}</div> */}
              {/* {proveedor.nit && (
                <div className="text-xs text-gray-500 font-mono">
                  NIT: {proveedor.nit}
                </div>
              )} */}
            </div>
          );
        },
      },
      {
        accessorKey: "total",
        header: "Total",
        size: 60,
        minSize: 30,
        cell: ({ getValue }) => {
          const total =
            typeof getValue() === "string"
              ? parseFloat(getValue() as string)
              : getValue<number>();
          const totalDisplay = isFinite(total) ? total.toFixed(2) : "0.00";
          return (
            <div className="text-right">
              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                ${totalDisplay}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "contexto",
        header: "Tipo",
        size: 70,
        minSize: 30,
        cell: ({ getValue }) => {
          const contexto = getValue<string>();
          const [tipo, estado] = contexto.split("|");
          return (
            <div className="space-y-1">
              <Badge variant={getContextColor(contexto)} className="rounded">
                {tipo} - {estado}
              </Badge>
              {/* <div className="text-xs text-gray-500">{estado}</div> */}
            </div>
          );
        },
      },
      {
        accessorKey: "comprobantes",
        header: "Comprobantes",
        size: 70,
        minSize: 30,
        cell: ({ getValue }) => {
          const comprobantes = getValue<string>();
          const comprobantesList = comprobantes
            .split("|")
            .filter((c) => c.trim());
          return (
            <div className="flex flex-wrap gap-1">
              {comprobantesList.map((comprobante, index) => {
                const isMediumLong = comprobante.length > 14; // ajusta el umbral si quieres
                return (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`text-xs font-mono ${
                      isMediumLong ? "basis-full" : "basis-auto"
                    }`}
                  >
                    {comprobante}
                  </Badge>
                );
              })}
            </div>
          );
        },
      },
      {
        accessorKey: "responsable",
        header: "Responsable",
        size: 70,
        minSize: 30,
        cell: ({ row }) => {
          const responsable = row.original.responsable;
          if (!responsable) {
            return (
              <div className="text-muted-foreground italic">Sin asignar</div>
            );
          }
          return (
            <div className="space-y-1">
              <div className="font-medium">
                {responsable.nombre} {responsable.apellido_paterno}
              </div>
              {/* <div className="text-xs text-gray-500 font-mono">
                DNI: {responsable.dni}
              </div> */}
            </div>
          );
        },
      },
      {
        accessorKey: "comentarios",
        header: "Comentarios",
        size: 200,
        minSize: 150,
        cell: ({ getValue }) => {
          const comentarios = getValue<string>();
          return (
            <div
              className={`text-xs ${
                !comentarios ? "italic text-muted-foreground" : ""
              }`}
            >
              {formatCell(comentarios, "Sin comentarios")}
            </div>
          );
        },
      },
    ],
    []
  );

  const { table, rowSelection, resetAll } = useCustomTable({
    data: purchases,
    columns,

    // Configuración de características
    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,

    // Columnas ocultas por defecto
    hiddenColumns: ["Select"],

    // Configuración de resize
    columnResizeMode: "onChange",

    // Persistencia con key única por usuario
    persistenceKey: `purchases-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const {
    selectedIndex,
    setSelectedIndex,
    isFocused,
    // setIsFocused: setIsFocusedTable,
    // hotkeys
  } = useKeyboardNavigation<PurchaseGet, HTMLTableElement>({
    items: purchases,
    containerRef: tableRef,
    isDragging: isDraggingColumn,
    onPrimaryAction: (purchase) => {
      handlePurchaseDetail(purchase);
    },
    getItemId: (purchase) => purchase.id,
  });
  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleRowDoubleClick = (purchase: PurchaseGet) => {
    handlePurchaseDetail(purchase);
  };

  const hasSelectedPurchases = Object.keys(rowSelection).length;

  const onPageChange = (page: number) => {
    // console.log('Cambiando a página:', page);
    setPage(page);
  };

  const onShowRowsChange = (rows: number) => {
    setPageSize(rows);
  };

  const handleRefetchPurchases = () => {
    refetchPurchases();
  };

  const toggleShowFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleResetTableConfig = () => {
    resetAll();
  };

  const handleDragStart = useCallback(() => {
    setIsDraggingColumn(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDraggingColumn(false);
  }, []);

  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      <ProtectedAction
        permission="com-module"
        roles={["Super Admin", "Administrador", "Vendedor", "Invitado"]}
        showLoader={true}
        showUnauthorizedMessage={true}
      >
        {/* Header */}
        <header className="bg-background rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
          <h1 className="text-lg font-bold text-primary">Compras</h1>
          <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2 md:gap-4 grow">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 h-4 w-4" />
                <Input
                  placeholder="Buscar por palabras clave..."
                  value={filters.keywords}
                  onChange={(e) => updateFilter("keywords", e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle de modo de búsqueda */}
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
                  className={`h-3 w-3 ${searchMode === "realtime" ? "text-yellow-500 dark:text-yellow-400" : "text-muted-foreground"}`}
                />
                {searchMode === "realtime" ? "Tiempo real" : "Manual"}
              </Button>

              <div className="flex items-center space-x-2">
                <Switch
                  id="infinite-scroll"
                  checked={isInfiniteScroll}
                  onCheckedChange={(checked) => {
                    setIsInfiniteScroll(checked);
                    setPage(1);
                  }}
                />
                <Label htmlFor="infinite-scroll">Scroll Infinito</Label>
              </div>

              <TooltipButton
                onClick={handleRefetchPurchases}
                buttonProps={{
                  className: "w-8",
                  disabled: isRefetchingPurchases || isFetching,
                }}
                tooltip={"Recargar compras"}
              >
                <RefreshCcw
                  className={`size-4 ${isRefetchingPurchases || isFetching ? "animate-spin" : ""}`}
                />
              </TooltipButton>

              <TooltipButton
                onClick={handleResetTableConfig}
                buttonProps={{
                  variant: "outline",
                  size: "sm",
                }}
                tooltip="Resetear orden y visibilidad de columnas"
              >
                <Settings className="h-4 w-4" />
                Resetear Tabla
              </TooltipButton>

              {/* <Button variant="outline" size="sm" onClick={resetFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Reset Filters
            </Button> */}
              <Button onClick={resetFilters}>
                <PackageSearch className="h-4 w-4" />
                Nueva búsqueda
              </Button>
              {/* <Button size={'sm'} onClick={toggleShowFilters}>
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button> */}
            </div>
          </section>

          {/* Filtros */}
          {showFilters && (
            <PurchaseFilters
              filters={filters}
              updateFilter={updateFilter}
              handleManualSearch={handleManualSearch}
              searchMode={searchMode}
            />
          )}
        </header>

        <div className="bg-background rounded-lg border border-border flex-1 min-h-screen md:min-h-0 overflow-hidden">
          <section className="flex flex-col h-full">
            {/* Results Info */}
            <div className="p-2 text-sm text-muted-foreground border-b border-border flex-shrink-0 flex items-center justify-between">
              {isLoading || isFetching ? (
                <span>Cargando...</span>
              ) : isError ? (
                <span className="text-destructive">
                  Error al cargar los datos
                </span>
              ) : purchases.length > 0 ? (
                isInfiniteScroll ? (
                  `Mostrando ${purchases.length} de ${
                    purchaseData?.meta?.total || 0
                  } compras`
                ) : (
                  `Mostrando ${purchaseData?.meta?.from || 0} - ${
                    purchaseData?.meta?.to || 0
                  } de ${purchaseData?.meta?.total || 0} compras`
                )
              ) : (
                <span className="text-amber-600 dark:text-amber-400">
                  No se encontraron compras para la sucursal actual
                </span>
              )}

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="columns-button"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Columnas
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 max-h-96 overflow-y-auto"
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
                {table && hasSelectedPurchases > 0 && (
                  <Button size={"sm"} className="relative">
                    Acciones
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                    >
                      {hasSelectedPurchases}
                    </Badge>
                  </Button>
                )}
              </div>
            </div>

            {/* CONTENEDOR CON SCROLL - Solo esta parte tiene scroll */}
            <div className="flex-1 min-h-0">
              {isInfiniteScroll ? (
                <div
                  id="purchases-list-scroll-container"
                  className="h-full overflow-auto relative"
                >
                  <InfiniteScroll
                    dataLength={purchases.length}
                    next={() => setPage((filters.pagina || 1) + 1)}
                    hasMore={
                      purchases.length < (purchaseData?.meta?.total ?? 0)
                    }
                    loader={
                      <div className="flex items-center justify-center gap-2 text-center p-6 text-xs sm:text-sm text-muted-foreground bg-accent/30">
                        <Loader2 className="size-4 animate-spin" />
                        Cargando más compras...
                      </div>
                    }
                    scrollableTarget="purchases-list-scroll-container"
                  >
                    <CustomizableTable
                      table={table}
                      isError={isError}
                      errorMessage="Ocurrió un error al cargar las compras"
                      isLoading={isLoading}
                      rows={filters.pagina_registros}
                      noDataMessage="No se encontraron compras"
                      selectedRowIndex={selectedIndex}
                      onRowClick={handleRowClick}
                      onRowDoubleClick={handleRowDoubleClick}
                      tableRef={tableRef}
                      focused={isFocused}
                      keyboardNavigationEnabled={true}
                      enableColumnReordering={true}
                      enableSorting={false}
                      onDragEnd={handleDragEnd}
                      onDragStart={handleDragStart}
                    />
                  </InfiniteScroll>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  <CustomizableTable
                    table={table}
                    isError={isError}
                    isFetching={isFetching}
                    isLoading={isLoading}
                    errorMessage="Ocurrió un error al cargar las compras"
                    noDataMessage="No se encontraron compras"
                    rows={filters.pagina_registros}
                    selectedRowIndex={selectedIndex}
                    onRowClick={handleRowClick}
                    onRowDoubleClick={handleRowDoubleClick}
                    tableRef={tableRef}
                    focused={isFocused}
                    keyboardNavigationEnabled={true}
                    enableColumnReordering={true}
                    enableSorting={false}
                    onDragEnd={handleDragEnd}
                    onDragStart={handleDragStart}
                  />
                </div>
              )}
            </div>

            {/* Pagination - FIJO en la parte inferior */}
            {!isInfiniteScroll && (purchaseData?.data?.length ?? 0) > 0 && (
              <div className="flex-shrink-0 border-t border-border bg-card">
                <Pagination
                  currentPage={filters.pagina || 1}
                  onPageChange={onPageChange}
                  totalData={purchaseData?.meta?.total ?? 1}
                  onShowRowsChange={onShowRowsChange}
                  showRows={filters.pagina_registros}
                />
              </div>
            )}
          </section>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeletePurchaseDialog
          open={showDeleteDialog}
          onClose={cancelDeletion}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      </ProtectedAction>
    </main>
  );
};

export default PurchaseListScreen;
