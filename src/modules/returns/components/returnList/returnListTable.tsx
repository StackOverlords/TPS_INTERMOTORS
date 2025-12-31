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
import authSDK from "@/services/sdk-simple-auth";
import { formatCurrency } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Edit, Eye, HelpCircle, Loader2, MoreVertical, Settings, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate } from "react-router";
import type { ReturnGetAll, ReturnsGetAllResponse } from "../../types/returnGet.types";
import type { useReturnsFilters } from "../../hooks/useReturnsFilters";
import { useCustomTable } from "@/hooks/useCustomTable";
import { formatInTimeZone } from "date-fns-tz";
import { getTodayDate, parseDateFromBackend } from "@/utils/dateFormatters";

interface ReturnsListTableProps {
    data: ReturnsGetAllResponse
    returns: ReturnGetAll[]
    filters: ReturnType<typeof useReturnsFilters>["filters"]
    setPage: (page: number) => void
    setPageSize: (rows: number) => void
    isInfiniteScroll: boolean
    isLoading: boolean
    isFetching: boolean,
    isError: boolean,
    handleDeleteSale: (id: number) => void
}

const SCREEN_PATH = "/dashboard/returns"

const ReturnsListTable: React.FC<ReturnsListTableProps> = ({
    data,
    returns,
    filters,
    setPage,
    setPageSize,
    isInfiniteScroll,
    isError,
    isFetching,
    isLoading,
    handleDeleteSale
}) => {
    const navigate = useNavigate()
    const user = authSDK.getCurrentUser()
    const tableRef = useRef<HTMLTableElement>(null)
    const [isDraggingColumn, setIsDraggingColumn] = useState(false);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const handleSeeDetails = useCallback((id: number) => {
        navigate(`/dashboard/returns/${id}`)
    }, [navigate])

    const handleUpdateOrder = useCallback((id: number) => {
        navigate(`/dashboard/returns/${id}/update`)
    }, [navigate])

    const columns = useMemo<ColumnDef<ReturnGetAll>[]>(() => [
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
            accessorKey: "nro",
            header: "Nro. Devolución",
            size: 80,
            minSize: 40,
            enableHiding: false,
            cell: ({ row, getValue }) => (
                <div
                    className="flex items-center gap-1.5">
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
                                    onClick={() => handleUpdateOrder(row.original.id)}>
                                    <Edit className="size-4 mr-2" />
                                    Editar devolución
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onKeyDown={e => e.stopPropagation()}
                                    onClick={() => handleDeleteSale(row.original.id)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Trash2 className="size-4 mr-2" />
                                    Eliminar devolución
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
                            <span className="font-medium text-foreground">{getValue<number>()}</span>
                            {/* <span className="text-xs text-muted-foreground">ID: {row.original.id}</span> */}
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
                    const isToday = parseDateFromBackend(dateString) === getTodayDate();

                    return (
                        <div className="text-center text-xs">
                            <div className={`font-medium ${isToday ? 'text-blue-600' : 'text-foreground'}`}>
                                {formatInTimeZone(dateString, timeZone, 'dd/MM/yyyy', { locale: es })}
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
                const nombreCompleto = resp
                    ? [
                        resp.nombre,
                        resp.apellido_paterno,
                        resp.apellido_materno
                    ]
                        .filter(item => item && item !== 'null' && item !== 'undefined')
                        .join(' ')
                    : 'Sin responsable';
                return (
                    <div className="space-y-1 flex flex-col">
                        <span className={`${!resp ? "italic text-muted-foreground" : "font-medium text-foreground"}`}>{nombreCompleto}</span>
                        {
                            resp?.dni &&
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
            accessorKey: "motivo",
            header: "Motivo",
            size: 120,
            minSize: 100,
            cell: ({ getValue }) => {
                const motivo = getValue<string>();
                return (
                    <div className="space-y-1 flex flex-col">
                        <Badge variant={'info'} className="text-xs w-max">
                            {motivo}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: "comprobante",
            header: "Comprobantes",
            size: 140,
            minSize: 120,
            cell: ({ getValue }) => {
                const comprobantes = getValue<string>();

                if (!comprobantes || comprobantes.trim() === "" || comprobantes === "|") {
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
                    .map(comp => comp.trim())
                    .filter(comp => comp !== "");

                return (
                    <div className="flex flex-col space-y-0.5 text-xs text-foreground items-center">
                        {comprobante1 && (
                            <Badge variant={'secondary'} className="flex justify-center w-full rounded py-0.5">{comprobante1}</Badge>
                        )}
                        {comprobante2 && (
                            <Badge variant={'secondary'} className="flex justify-center w-full rounded py-0.5">{comprobante2}</Badge>
                        )}
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
    ], [handleSeeDetails, handleUpdateOrder, handleDeleteSale]);

    const {
        table,
        rowSelection,
        // resetAll,
    } = useCustomTable({
        data: returns,
        columns,

        // Configuración de características
        enableSorting: true,
        enableColumnResizing: true,
        enableRowSelection: true,
        enableColumnVisibility: true,
        enableColumnOrdering: true,
        enablePagination: false,

        // Columnas ocultas por defecto
        hiddenColumns: ['Select'],

        // Configuración de resize
        columnResizeMode: "onChange",

        defaultSortBy: [
            { id: 'fecha', desc: true }
        ],

        // Persistencia con key única por usuario
        persistenceKey: `returns-table-${user?.name}`,
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    const {
        selectedIndex,
        setSelectedIndex,
        isFocused,
        // setIsFocused: setIsFocusedTable,
        hotkeys
    } = useKeyboardNavigation<ReturnGetAll, HTMLTableElement>({
        items: returns,
        containerRef: tableRef,
        screenPath: SCREEN_PATH,
        isDragging: isDraggingColumn,
        onPrimaryAction: (quotation) => {
            handleSeeDetails(quotation.id)
        },
        getItemId: (quotation) => quotation.id
    });
    const handleRowClick = (index: number) => {
        setSelectedIndex(index);
    };

    const handleRowDoubleClick = (quotation: ReturnGetAll) => {
        handleSeeDetails(quotation.id)
    };

    const hasReturnsSelected = Object.keys(rowSelection).length;

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
                    returns.length > 0 ? (
                        isInfiniteScroll ? (
                            `Mostrando ${returns.length} de ${data?.meta?.total} devoluciones`
                        ) : (
                            (() => {
                                const pagina = filters.pagina ?? 1;
                                const porPagina = filters.pagina_registros ?? 1;

                                const inicio = (pagina - 1) * porPagina + 1;
                                const fin = pagina * porPagina;

                                return `Mostrando ${inicio} - ${fin} de ${data?.meta?.total} devoluciones`;
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
                        table && hasReturnsSelected > 0 && (
                            <Button size={'sm'} className="relative"
                            // onClick={handleAddSelectedToCart}
                            >
                                Proximamente...
                                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                                    {hasReturnsSelected}
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
                                        <p> <ShortcutKey combo={hotkeys.primaryAction ?? ''} /> Detalle de devolución </p>
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
                        id="returns-list-scroll-container"
                        className="h-full overflow-auto relative">
                        <InfiniteScroll
                            dataLength={returns.length}
                            next={() => setPage((filters.pagina || 1) + 1)}
                            hasMore={returns.length < ((data?.meta?.total ?? 0))}
                            loader={
                                <div className="flex items-center justify-center gap-2 text-center p-6 text-xs sm:text-sm text-gray-500 bg-gray-50">
                                    <Loader2 className="size-4 animate-spin" />
                                    Cargando más devoluciones...
                                </div>
                            }
                            scrollableTarget="returns-list-scroll-container"
                        >
                            <CustomizableTable
                                table={table}
                                isError={isError}
                                errorMessage="Ocurrió un error al cargar las devoluciones"
                                isLoading={isLoading}
                                rows={filters.pagina_registros}
                                noDataMessage="No se encontraron devoluciones"
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
                            errorMessage="Ocurrió un error al cargar las devoluciones"
                            noDataMessage="No se encontraron devoluciones"
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

export default ReturnsListTable;