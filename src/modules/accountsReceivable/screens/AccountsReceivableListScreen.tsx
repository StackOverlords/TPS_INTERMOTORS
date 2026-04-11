import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import { ColumnVisibilityDropdown } from "@/components/common/ColumnVisibilityDropdown";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import ShortcutKey from "@/components/common/ShortcutKey";
import TooltipButton from "@/components/common/TooltipButton";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";
import { useCustomTable } from "@/hooks/useCustomTable";
// import { useErrorHandler } from "@/hooks/useErrorHandler";
import { COMMANDS, useCommands, useKeybindingKeys } from "@/keybindings";
import authSDK from "@/services/sdk-simple-auth";
import { useBranchStore } from "@/states/branchStore";
import { formatCell } from "@/utils/formatCell";
import { formatColumnNumber, formatCurrency } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import { HelpCircle, Loader2, RefreshCcw, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { AccountReceivableDetailModal } from "../components/accountReceivableDetail/AccountReceivableDetailModal";
import AccountReceivableFilters from "../components/accountsReceivableList/AccountReceivableFilters";
import { useAccountsReceivablePaginated } from "../hooks/queries/useAccountsReceivablePaginated";
import { useAccountReceivableFilters } from "../hooks/useAccountReceivableFilters";
import type { AccountReceivable } from "../types/accountReceivable";

const AccountsReceivableListScreen = () => {
  const [isInfiniteScroll, setIsInfiniteScroll] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const user = authSDK.getCurrentUser();
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const [searchMode, setSearchMode] = useState<"realtime" | "manual">("manual");
  const [selectedAccountReceivableId, setSelectedAccountReceivableId] = useState<
    number | null
  >(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Obtener teclas actuales del store
  const filter1Keys = useKeybindingKeys("tableAndFilters.filter1");
  const filter2Keys = useKeybindingKeys("tableAndFilters.filter2");
  const filter3Keys = useKeybindingKeys("tableAndFilters.filter3");

  const {
    filters,
    debouncedFilters,
    appliedFilters,
    updateFilter,
    setPage,
    setPageSize,
    applyFilters,
  } = useAccountReceivableFilters(Number(selectedBranchId) || 1);

  const activeFilters =
    searchMode === "realtime" ? debouncedFilters : appliedFilters;

  const {
    data: accountsReceivableData,
    isLoading,
    error,
    isFetching,
    isError,
    refetch: refetchAccountsReceivable,
    isRefetching: isRefetchingAccountsReceivable,
  } = useAccountsReceivablePaginated(activeFilters);

  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);

  // const { handleError } = useErrorHandler();

  useEffect(() => {
    if (!accountsReceivableData?.data || error || isFetching) return;

    if (isInfiniteScroll && filters.pagina && filters.pagina > 1) {
      setAccountsReceivable((prev) => {
        const newAccounts = accountsReceivableData.data.filter(
          (newAccount: any) =>
            !prev.some(
              (existingAccount) => existingAccount.id === newAccount.id
            )
        );
        return [...prev, ...newAccounts];
      });
    } else {
      setAccountsReceivable(accountsReceivableData.data);
    }
  }, [
    accountsReceivableData?.data,
    isInfiniteScroll,
    filters.pagina,
    error,
    isFetching,
  ]);

  // Función para determinar el color del saldo
  const getSaldoColor = (saldo: number) => {
    if (saldo === 0) return "success";
    if (saldo > 0) return "danger";
    return "default";
  };

  // Función para calcular días de vencimiento
  const calcularDiasVencimiento = (plazoPago: string | null): number | null => {
    if (!plazoPago) return null;
    const hoy = new Date();
    const fechaPlazo = new Date(plazoPago);
    const diferencia = fechaPlazo.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  };

  const columns = useMemo<ColumnDef<AccountReceivable>[]>(
    () => [
      // {
      //   accessorKey: "id",
      //   header: "ID",
      //   enableSorting: true,
      //   enableHiding: true,
      //   size: 60,
      //   minSize: 30,
      //   cell: ({ getValue }) => {
      //     const id = getValue<number>();
      //     return <div className="text-center font-medium">{id}</div>;
      //   },
      // },
      {
        accessorKey: "nro_venta",
        header: "Nro. Venta",
        size: 110,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => (
          <div className="text-center font-semibold">
            {formatColumnNumber(getValue<string>(), "-")}
          </div>
        ),
      },
      {
        id: "cliente_nombre",
        accessorFn: (row) => row.cliente.cliente,
        header: "Cliente",
        size: 200,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => (
          <div className="font-medium">{getValue<string>()}</div>
        ),
      },
      // {
      //     id: "cliente_id",
      //     accessorFn: (row) => row.cliente.id,
      //     header: "ID Cliente",
      //     size: 80,
      //     minSize: 30,
      //     enableHiding: true,
      //     cell: ({ getValue }) => (
      //         <div className="text-center text-sm text-muted-foreground">{getValue<number>()}</div>
      //     ),
      // },
      {
        id: "cliente_nit",
        accessorFn: (row) => row.cliente.nit,
        header: "NIT",
        size: 120,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => (
          <div className="text-center text-sm">
            {getValue<number | null>() || formatCell(null)}
          </div>
        ),
      },
      {
        id: "cliente_contacto",
        accessorFn: (row) => row.cliente.contacto,
        header: "Contacto",
        size: 150,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => (
          <div className="text-sm">
            {getValue<string | null>() || formatCell(null)}
          </div>
        ),
      },
      {
        accessorKey: "fecha",
        header: "Fecha Venta",
        size: 110,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return (
            <div className="text-center font-medium">
              {new Date(date).toLocaleDateString("es-ES")}
            </div>
          );
        },
      },
      {
        id: "hora_venta",
        accessorFn: (row) => row.fecha,
        header: "Hora Venta",
        size: 90,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return (
            <div className="text-center text-sm text-muted-foreground">
              {new Date(date).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          );
        },
      },
      {
        accessorKey: "plazo_pago",
        header: "Plazo de Pago",
        size: 120,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          const plazoPago = getValue<string | null>();
          return (
            <div className="text-center font-medium">
              {plazoPago
                ? new Date(plazoPago).toLocaleDateString("es-ES")
                : formatCell(null)}
            </div>
          );
        },
      },
      {
        id: "dias_vencimiento",
        accessorFn: (row) => row.plazo_pago,
        header: "Días Vencimiento",
        size: 130,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          const plazoPago = getValue<string | null>();
          const dias = calcularDiasVencimiento(plazoPago);

          if (dias === null) {
            return (
              <div className="text-center text-muted-foreground/50">
                {formatCell(null)}
              </div>
            );
          }

          return (
            <div
              className={`text-center text-sm font-medium ${
                dias < 0
                  ? "text-destructive"
                  : dias <= 15
                    ? "text-yellow-600"
                    : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {dias < 0 ? `Vencido (${Math.abs(dias)} días)` : `${dias} días`}
            </div>
          );
        },
      },
      {
        accessorKey: "total_vendido",
        header: "Total Vendido",
        size: 120,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          return (
            <div className="text-right font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(getValue<number>())}
            </div>
          );
        },
      },
      {
        accessorKey: "total_pagado",
        header: "Total Pagado",
        size: 120,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          return (
            <div className="text-right font-medium text-emerald-600 dark:text-emerald-400">
              {formatCurrency(getValue<number>())}
            </div>
          );
        },
      },
      {
        accessorKey: "saldo",
        header: "Saldo",
        size: 120,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          const saldo = getValue<number>();
          return (
            <div className="text-center">
              <Badge
                variant={getSaldoColor(saldo)}
                className="rounded font-bold"
              >
                {formatCurrency(saldo)}
              </Badge>
            </div>
          );
        },
      },

      {
        id: "cliente_direccion",
        accessorFn: (row) => row.cliente.direccion,
        header: "Dirección",
        size: 180,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => (
          <div className="text-sm">
            {getValue<string | null>() || formatCell(null)}
          </div>
        ),
      },
      {
        id: "responsable_nombre",
        accessorFn: (row) => row.responsable,
        header: "Responsable",
        size: 150,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          const responsable = getValue<{
            id: number;
            nombre: string;
            apellido_paterno: string;
            apellido_materno: string | null;
          } | null>();

          if (!responsable) {
            return (
              <div className="text-center text-muted-foreground/50">
                {formatCell(null)}
              </div>
            );
          }

          return (
            <div className="font-medium">
              {responsable.nombre} {responsable.apellido_paterno}
            </div>
          );
        },
      },
      // {
      //     id: "responsable_id",
      //     accessorFn: (row) => row.responsable?.id,
      //     header: "ID Responsable",
      //     size: 100,
      //     minSize: 30,
      //     enableHiding: true,
      //     cell: ({ getValue }) => {
      //         const id = getValue<number | undefined>();
      //         return (
      //             <div className="text-center text-sm text-muted-foreground">
      //                 {id || formatCell(null)}
      //             </div>
      //         );
      //     },
      // },
      {
        accessorKey: "contexto",
        header: "Contexto",
        size: 180,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          const contexto = getValue<string>();
          return <div className="text-sm">{contexto}</div>;
        },
      },
      {
        accessorKey: "comprobantes",
        header: "Comprobantes",
        size: 120,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          const comprobantes = getValue<string>();
          return (
            <div className="text-sm text-center">
              {comprobantes !== "|" ? comprobantes : formatCell(null)}
            </div>
          );
        },
      },
      {
        accessorKey: "comentarios",
        header: "Comentarios",
        size: 200,
        minSize: 30,
        enableHiding: true,
        cell: ({ getValue }) => {
          const comentarios = getValue<string | null>();
          return (
            <div className="text-sm">
              {comentarios ? (
                <span className="italic">{comentarios}</span>
              ) : (
                <span className="text-muted-foreground/50">
                  {formatCell(null)}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const { table } = useCustomTable({
    data: accountsReceivable,
    columns,
    enableSorting: true,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,
    // Columnas ocultas por defecto - menos importantes
    hiddenColumns: [
      "cliente_id",
      "cliente_nit",
      "cliente_contacto",
      "cliente_direccion",
      "hora_venta",
      "responsable_id",
      "comprobantes",
      "contexto",
    ],
    columnResizeMode: "onChange",
    persistenceKey: `accounts-receivable-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const { selectedIndex, setSelectedIndex, isFocused, hotkeys } =
    useKeyboardNavigation<AccountReceivable, HTMLTableElement>({
      items: accountsReceivable,
      containerRef: tableRef,
      isDragging: isDraggingColumn,
      onPrimaryAction: (account) => {
        if (!modalOpen) {
          setSelectedAccountReceivableId(account.id);
          setModalOpen(true);
        }
      },
      onSecondaryAction: (_account) => {
        // Acción secundaria: podrías agregar navegación a edición
      },
      getItemId: (account) => account.id,
    });

  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const onPageChange = (page: number) => {
    setPage(page);
  };

  const onShowRowsChange = (rows: number) => {
    setPageSize(rows);
  };

  const handleRefetchAccountsReceivable = () => {
    refetchAccountsReceivable();
  };

  const handleManualSearch = () => {
    if (searchMode === "manual") {
      applyFilters();
    }
  };

  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "realtime" ? "manual" : "realtime"));
  };

  const handleDragStart = useCallback(() => {
    setIsDraggingColumn(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDraggingColumn(false);
  }, []);

  useCommands(
    {
      "searchFilters.focusSearch": handleManualSearch,
      // 'forms.reset': handleResetFilters
    },
    {
      enableOnFormTags: true,
    }
  );
  return (
    <main className="h-full p-2 gap-2 flex flex-col">
      {/* Header */}
      <header className="bg-background rounded-lg p-2 space-y-2 border border-border flex-shrink-0">
        <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2 md:gap-4 grow">
            <h1 className="text-lg font-bold text-primary">
              Cuentas por Cobrar
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle de modo de búsqueda */}
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
                    ? "text-yellow-500 dark:text-yellow-400"
                    : "text-muted-foreground"
                }`}
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
              onClick={handleRefetchAccountsReceivable}
              buttonProps={{
                className: "w-8",
                disabled: isRefetchingAccountsReceivable || isFetching,
              }}
              tooltip={"Recargar cuentas por cobrar"}
            >
              <RefreshCcw
                className={`size-4 ${
                  isRefetchingAccountsReceivable || isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />
            </TooltipButton>

            <TooltipWrapper
              tooltipContentProps={{
                align: "end",
                className: "max-w-xs",
              }}
              tooltip={
                <div className="flex flex-col space-y-3">
                  <div className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Atajos de teclado
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-medium text-muted-foreground tracking-wide">
                      Navegación filtros
                    </h4>
                    <div className="space-y-1 text-muted-foreground text-xs">
                      <p>
                        <ShortcutKey combo={filter1Keys} />
                        {COMMANDS["tableAndFilters.filter1"].description}: Nro.
                        Venta
                      </p>
                      <p>
                        <ShortcutKey combo={filter2Keys} />
                        {COMMANDS["tableAndFilters.filter2"].description}: ID
                        Cliente
                      </p>
                      <p>
                        <ShortcutKey combo={filter3Keys} />
                        {COMMANDS["tableAndFilters.filter3"].description}: Tipo
                        Vencimiento
                      </p>
                    </div>
                  </div>
                </div>
              }
            >
              <span className="border-border border h-8 w-8 px-1 rounded-md flex items-center justify-center cursor-help hover:bg-accent">
                <HelpCircle />
              </span>
            </TooltipWrapper>
          </div>
        </section>

        {/* Filtros */}
        <AccountReceivableFilters
          filters={filters}
          updateFilter={updateFilter}
          handleManualSearch={handleManualSearch}
          searchMode={searchMode}
        />
      </header>

      {/* Tabla */}
      <div className="bg-background rounded-lg border border-border flex-1 min-h-0 flex flex-col">
        {/* Results Info */}
        <div className="p-2 text-sm text-muted-foreground border-b border-border flex-shrink-0 flex items-center justify-between">
          {accountsReceivable.length > 0 ? (
            isInfiniteScroll ? (
              `Mostrando ${accountsReceivable.length} de ${accountsReceivableData?.meta.total} cuentas por cobrar`
            ) : (
              (() => {
                const pagina = filters.pagina ?? 1;
                const porPagina = filters.pagina_registros ?? 1;
                const inicio = (pagina - 1) * porPagina + 1;
                const fin = pagina * porPagina;
                return `Mostrando ${inicio} - ${fin} de ${accountsReceivableData?.meta.total} cuentas por cobrar`;
              })()
            )
          ) : (
            <span>Cargando...</span>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <ColumnVisibilityDropdown table={table} />
            <TooltipWrapper
              tooltipContentProps={{
                align: "end",
                className: "max-w-xs",
              }}
              tooltip={
                <div className="flex flex-col space-y-3">
                  <div className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Atajos de teclado
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-medium text-muted-foreground tracking-wide">
                      Navegación
                    </h4>
                    <div className="space-y-1 text-muted-foreground text-xs">
                      <p>
                        <ShortcutKey combo={hotkeys.activate ?? ""} /> Activar
                        tabla
                      </p>
                      <p>
                        <ShortcutKey combo={hotkeys.deactivate ?? ""} /> Salir
                        de tabla
                      </p>
                      <p>
                        <ShortcutKey combo={hotkeys.moveUp ?? ""} /> /{" "}
                        <ShortcutKey combo={hotkeys.moveDown ?? ""} /> Navegar
                        filas
                      </p>
                    </div>
                  </div>
                </div>
              }
            >
              <span className="border-border border h-8 w-8 px-1 rounded-md flex items-center justify-center cursor-help hover:bg-accent">
                <HelpCircle />
              </span>
            </TooltipWrapper>
          </div>
        </div>

        {/* CONTENEDOR CON SCROLL */}
        <div className="flex-1 min-h-0">
          {isInfiniteScroll ? (
            <div
              className="h-full overflow-auto relative"
              id="accounts-receivable-scroll-container"
            >
              <InfiniteScroll
                dataLength={accountsReceivable.length}
                next={() => setPage((filters.pagina || 1) + 1)}
                hasMore={
                  accountsReceivable.length <
                  (accountsReceivableData?.meta.total || 0)
                }
                loader={
                  <div className="flex items-center justify-center gap-2 text-center p-6 text-xs sm:text-sm text-muted-foreground bg-accent/30">
                    <Loader2 className="size-4 animate-spin" />
                    Cargando más cuentas por cobrar...
                  </div>
                }
                scrollableTarget="accounts-receivable-scroll-container"
              >
                <CustomizableTable
                  table={table}
                  isError={isError}
                  errorMessage="Ocurrió un error al cargar las cuentas por cobrar"
                  isLoading={isLoading}
                  rows={filters.pagina_registros}
                  noDataMessage="No se encontraron cuentas por cobrar"
                  selectedRowIndex={selectedIndex}
                  onRowClick={handleRowClick}
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
            <CustomizableTable
              table={table}
              isError={isError}
              isFetching={isFetching}
              isLoading={isLoading}
              errorMessage="Ocurrió un error al cargar las cuentas por cobrar"
              rows={filters.pagina_registros}
              noDataMessage="No se encontraron cuentas por cobrar"
              selectedRowIndex={selectedIndex}
              onRowClick={handleRowClick}
              tableRef={tableRef}
              focused={isFocused}
              keyboardNavigationEnabled={true}
              enableColumnReordering={true}
              enableSorting={false}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
            />
          )}
        </div>

        {/* Pagination */}
        {!isInfiniteScroll && (accountsReceivableData?.data?.length ?? 0) > 0 && (
          <Pagination
            currentPage={filters.pagina || 1}
            onPageChange={onPageChange}
            totalData={accountsReceivableData?.meta.total || 1}
            onShowRowsChange={onShowRowsChange}
            showRows={filters.pagina_registros}
          />
        )}
      </div>
      {/* Totales de la página visible */}
      {accountsReceivable.length > 0 && (
        <div className="p-3 border border-border flex-shrink-0 bg-background">
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">
                Total Vendido:
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(
                  accountsReceivable.reduce((sum, ar) => sum + ar.total_vendido, 0)
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">
                Total Pagado:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(
                  accountsReceivable.reduce((sum, ar) => sum + ar.total_pagado, 0)
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">
                Saldo Pendiente:
              </span>
              <span className="font-bold text-destructive">
                {formatCurrency(
                  accountsReceivable.reduce((sum, ar) => sum + ar.saldo, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles de cuenta por cobrar */}
      <AccountReceivableDetailModal
        accountReceivable={
          accountsReceivable.find((ar) => ar.id === selectedAccountReceivableId) ||
          null
        }
        open={modalOpen}
        onOpenChange={setModalOpen}
        onPaymentChange={refetchAccountsReceivable}
      />
    </main>
  );
};

export default AccountsReceivableListScreen;
