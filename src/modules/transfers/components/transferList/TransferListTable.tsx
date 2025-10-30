import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/atoms/dropdown-menu";
import { Kbd } from "@/components/atoms/kbd";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import ShortcutKey from "@/components/common/ShortcutKey";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";
import { useCustomTable } from "@/hooks/useCustomTable";
import authSDK from "@/services/sdk-simple-auth";
import { formatCurrency } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Edit, Eye, HelpCircle, Loader2, MoreVertical, Settings, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate } from "react-router";
import type { useTransfersFilters } from "../../hooks/useTransfersFilters";
import type { TransferGetAll, TransfersGetAllResponse } from "../../types/transferGet.types";

interface TransferListTableProps {
    data: TransfersGetAllResponse
    transfers: TransferGetAll[]
    filters: ReturnType<typeof useTransfersFilters>["filters"]
    setPage: (page: number) => void
    setPageSize: (rows: number) => void
    isInfiniteScroll: boolean
    isLoading: boolean
    isFetching: boolean,
    isError: boolean,
    handleDeleteTransfer: (id: number) => void
}

const TransferListTable: React.FC<TransferListTableProps> = ({
    data,
    transfers,
    filters,
    setPage,
    setPageSize,
    isInfiniteScroll,
    isError,
    isFetching,
    isLoading,
    handleDeleteTransfer
}) => {
    const navigate = useNavigate()
    const user = authSDK.getCurrentUser()
    const tableRef = useRef<HTMLTableElement>(null)
    const [isDraggingColumn, setIsDraggingColumn] = useState(false);

    const handleSeeDetails = useCallback((id: number) => {
        navigate(`/dashboard/transfers/${id}`)
    }, [navigate])

    const handleUpdateTransfer = useCallback((id: number) => {
        navigate(`/dashboard/transfers/${id}/update`)
    }, [navigate])

    const columns = useMemo<ColumnDef<TransferGetAll>[]>(() => [
        {
            id: "Select",
            header: ({ table }) => (
                <Checkbox
                    className="border border-gray-400"
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Seleccionar todo"
                />
            ),
            cell: ({ row }) => (
                <div className="px-1">
                    <Checkbox
                        className="border border-gray-400"
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Seleccionar fila"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: true,
            size: 40,
            minSize: 40,
        },
        {
            accessorKey: "nro_transferencia",
            header: "Nro. Transferencia",
            size: 120,
            minSize: 100,
            enableHiding: false,
            cell: ({ row, getValue }) => (
                <div className="flex items-center gap-1.5">
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
                                        if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
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
                                className="w-48">
                                <DropdownMenuItem
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onClick={() => handleSeeDetails(row.original.id)}
                                >
                                    <Eye className="size-4 mr-2" />
                                    Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onClick={() => handleUpdateTransfer(row.original.id)}>
                                    <Edit className="size-4 mr-2" />
                                    Editar transferencia
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onKeyDown={e => e.stopPropagation()}
                                    onClick={() => handleDeleteTransfer(row.original.id)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Trash2 className="size-4 mr-2" />
                                    Eliminar transferencia
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <TooltipWrapper
                        tooltipContentProps={{
                            align: 'start'
                        }}
                        tooltip={
                            <p className="flex gap-1">Presiona <Kbd>enter</Kbd> para ver los detalles</p>
                        }
                    >
                        <div className="space-y-1 flex flex-col">
                            <span className="font-medium text-foreground">{getValue<string>()}</span>
                            <span className="text-xs text-muted-foreground">ID: {row.original.id}</span>
                        </div>
                    </TooltipWrapper>
                </div>
            ),
        },
        {
            accessorKey: "fecha",
            header: "Fecha",
            size: 100,
            minSize: 90,
            cell: ({ getValue }) => {
                const dateString = getValue<string>();

                try {
                    const date = new Date(dateString);
                    const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                    return (
                        <div className="text-center text-xs">
                            <div className={`font-medium ${isToday ? 'text-blue-600' : 'text-foreground'}`}>
                                {format(date, "dd/MM/yyyy", { locale: es })}
                            </div>
                            <div className="text-muted-foreground flex items-center justify-center gap-1">
                                <Clock className="size-3" />
                                {format(date, "HH:mm", { locale: es })}
                            </div>
                        </div>
                    );
                } catch {
                    return <span className="text-xs text-muted-foreground">{dateString}</span>;
                }
            },
        },
        {
            accessorKey: "responsable",
            header: "Responsable",
            size: 180,
            minSize: 150,
            cell: ({ row }) => {
                const resp = row.original.responsable;
                const nombreCompleto = `${resp ? `${resp.nombre} ${resp.apellido_paterno}${resp.apellido_materno ? ` ${resp.apellido_materno}` : ''}` : 'Sin responsable'}`;
                return (
                    <div className="space-y-1 flex flex-col">
                        <span className={`${!resp ? "italic text-muted-foreground" : "font-medium text-foreground"}`}>{nombreCompleto}</span>
                        {
                            resp &&
                            <span className="text-xs text-muted-foreground">DNI: {resp.dni}</span>
                        }
                    </div>
                );
            },
        },
        {
            accessorKey: "total",
            header: "Total",
            size: 120,
            minSize: 100,
            cell: ({ getValue }) => {
                return (
                    <div className="flex flex-col space-y-0.5 items-end">
                        <span className=" font-medium text-green-600">{formatCurrency(getValue<number>())}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "estado",
            header: "Estado",
            size: 160,
            minSize: 100,
            cell: ({ getValue }) => {
                const estado = getValue<string>();
                const variant = estado === 'RECIBIDA' ? 'success' : estado === 'RECHAZADA' ? 'destructive' : 'warning';
                return (
                    <div className="space-y-1 flex flex-col">
                        <Badge variant={variant} className="text-xs w-max">
                            {estado}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: "comprobante",
            header: "Comprobante",
            size: 140,
            minSize: 120,
            cell: ({ getValue }) => {
                const comprobante = getValue<string | null>();

                if (!comprobante || comprobante.trim() === "") {
                    return (
                        <div className="text-center">
                            <span className="text-muted-foreground italic text-xs">
                                Sin comprobante
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="flex flex-col space-y-0.5 text-xs text-foreground items-center">
                        <Badge variant={'secondary'} className="flex justify-center w-full rounded py-0.5">{comprobante}</Badge>
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
                const comentarios = getValue<string | null>();
                return (
                    <div className={`text-xs text-muted-foreground truncate ${!comentarios ? "italic" : ""}`}>
                        {comentarios || "Sin comentarios"}
                    </div>
                );
            },
        },
    ], [handleSeeDetails, handleUpdateTransfer, handleDeleteTransfer]);

    const {
        table,
        rowSelection,
    } = useCustomTable({
        data: transfers,
        columns,

        // Configuración de características
        enableSorting: false,
        enableColumnResizing: true,
        enableRowSelection: true,
        enableColumnVisibility: true,
        enableColumnOrdering: true,
        enablePagination: false,

        // Columnas ocultas por defecto
        hiddenColumns: ['Select'],

        // Configuración de resize
        columnResizeMode: "onChange",

        // Persistencia con key única por usuario
        persistenceKey: `transfers-table-${user?.name}`,
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    const {
        selectedIndex,
        setSelectedIndex,
        isFocused,
        hotkeys
    } = useKeyboardNavigation<TransferGetAll, HTMLTableElement>({
        items: transfers,
        containerRef: tableRef,
        isDragging: isDraggingColumn,
        onPrimaryAction: (transfer) => {
            handleSeeDetails(transfer.id)
        },
        getItemId: (transfer) => transfer.id
    });
    const handleRowClick = (index: number) => {
        setSelectedIndex(index);
    };

    const handleRowDoubleClick = (transfer: TransferGetAll) => {
        handleSeeDetails(transfer.id)
    };

    const hasTransfersSelected = Object.keys(rowSelection).length;

    const onPageChange = (page: number) => {
        setPage(page);
    };

    const onShowRowsChange = (rows: number) => {
        setPageSize(rows);
    };

    const handleDragStart = useCallback(() => {
        setIsDraggingColumn(true);
    }, []);

    const handleDragEnd = useCallback(() => {
        setIsDraggingColumn(false);
    }, []);

    return (
        <section className="flex flex-col h-full">
            {/* Results Info */}
            <div className="p-2 text-sm text-gray-600 border-b border-border flex-shrink-0 flex items-center justify-between">
                {
                    transfers.length > 0 ? (
                        isInfiniteScroll ? (
                            `Mostrando ${transfers.length} de ${data?.meta?.total} transferencias`
                        ) : (
                            (() => {
                                const pagina = filters.pagina ?? 1;
                                const porPagina = filters.pagina_registros ?? 1;

                                const inicio = (pagina - 1) * porPagina + 1;
                                const fin = pagina * porPagina;

                                return `Mostrando ${inicio} - ${fin} de ${data?.meta?.total} transferencias`;
                            })()
                        )
                    ) : (
                        <span>Cargando...</span>
                    )
                }

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4" />
                                Columnas
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto border border-gray-200">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuItem
                                        key={column.id}
                                        className="flex items-center space-x-2 cursor-pointer"
                                        onSelect={(e) => e.preventDefault()}
                                        onClick={() => column.toggleVisibility(!column.getIsVisible())}
                                    >
                                        <Checkbox
                                            className="border border-gray-400"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        />
                                        <span className="flex-1">
                                            {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {
                        table && hasTransfersSelected > 0 && (
                            <Button size={'sm'} className="relative">
                                Proximamente...
                                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                                    {hasTransfersSelected}
                                </Badge>
                            </Button>
                        )
                    }
                    <TooltipWrapper
                        tooltipContentProps={{
                            align: 'end',
                            className: 'max-w-xs'
                        }}
                        tooltip={
                            <div className="flex flex-col space-y-3">
                                {/* Título del tooltip */}
                                <div className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                    Atajos de teclado
                                </div>

                                {/* Sección de navegación básica */}
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-medium text-gray-700 tracking-wide">Navegación</h4>
                                    <div className="space-y-1 text-gray-600 text-xs">
                                        <p> <ShortcutKey combo={hotkeys.activate ?? ''} /> Activar tabla </p>
                                        <p> <ShortcutKey combo={hotkeys.deactivate ?? ''} /> Salir de tabla </p>
                                        <p> <ShortcutKey combo={hotkeys.moveUp ?? ''} /> / <ShortcutKey combo={hotkeys.moveDown ?? ''} /> Navegar filas </p>
                                        <p> <ShortcutKey combo={hotkeys.navigate ?? ''} /> Cambiar columna</p>
                                    </div>
                                </div>

                                {/* Sección de acciones */}
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-medium text-blue-600 tracking-wide">Acciones</h4>
                                    <div className="space-y-1 text-gray-600 text-xs">
                                        <p> <ShortcutKey combo={hotkeys.primaryAction ?? ''} /> Detalle de transferencia </p>
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

            {/* CONTENEDOR CON SCROLL - Solo esta parte tiene scroll */}
            <div className="flex-1 min-h-0">
                {isInfiniteScroll ? (
                    <div
                        id="transfers-list-scroll-container"
                        className="h-full overflow-auto relative">
                        <InfiniteScroll
                            dataLength={transfers.length}
                            next={() => setPage((filters.pagina || 1) + 1)}
                            hasMore={transfers.length < ((data?.meta?.total ?? 0))}
                            loader={
                                <div className="flex items-center justify-center gap-2 text-center p-6 text-xs sm:text-sm text-gray-500 bg-gray-50">
                                    <Loader2 className="size-4 animate-spin" />
                                    Cargando más transferencias...
                                </div>
                            }
                            scrollableTarget="transfers-list-scroll-container"
                        >
                            <CustomizableTable
                                table={table}
                                isError={isError}
                                errorMessage="Ocurrió un error al cargar las transferencias"
                                isLoading={isLoading}
                                rows={filters.pagina_registros}
                                noDataMessage="No se encontraron transferencias"
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
                            errorMessage="Ocurrió un error al cargar las transferencias"
                            noDataMessage="No se encontraron transferencias"
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
            {
                !isInfiniteScroll && (data?.data?.length ?? 0) > 0 && (
                    <div className="flex-shrink-0 border-t border-border bg-card">
                        <Pagination
                            currentPage={filters.pagina || 1}
                            onPageChange={onPageChange}
                            totalData={data?.meta?.total ?? 1}
                            onShowRowsChange={onShowRowsChange}
                            showRows={filters.pagina_registros}
                        />
                    </div>
                )
            }
        </section>
    );
}

export default TransferListTable;