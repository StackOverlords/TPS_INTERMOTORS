import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/atoms/dropdown-menu";
import { Kbd } from "@/components/atoms/kbd";
import CustomizableTable from "@/components/common/CustomizableTable";
import Pagination from "@/components/common/pagination";
import RowsPerPageSelect from "@/components/common/RowsPerPageSelect";
import ShortcutKey from "@/components/common/ShortcutKey";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { useKeyboardNavigation } from "@/hooks/keyBindings/useKeyboardNavigation";
import authSDK from "@/services/sdk-simple-auth";
import { formatCurrency } from "@/utils/formaters";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef, type RowSelectionState } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Edit, Eye, HelpCircle, Loader2, MoreVertical, Phone, Settings, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate } from "react-router";
import type { useSalesFilters } from "../hooks/useSalesFilters";
import type { SaleGetAll, SalesGetAllResponse } from "../types/salesGetResponse";

interface SalesListTableProps {
    data: SalesGetAllResponse
    sales: SaleGetAll[]
    filters: ReturnType<typeof useSalesFilters>["filters"]
    setPage: ReturnType<typeof useSalesFilters>["setPage"]
    updateFilter: ReturnType<typeof useSalesFilters>["updateFilter"]
    isInfiniteScroll: boolean
    isLoading: boolean
    isFetching: boolean,
    isError: boolean,
    handleDeleteSale: (saleId: number) => void
}

const getColumnVisibilityKey = (userName: string) => `sales-columns-${userName}`;

const SalesListTable: React.FC<SalesListTableProps> = ({
    data,
    sales,
    filters,
    setPage,
    updateFilter,
    isInfiniteScroll,
    isError,
    isFetching,
    isLoading,
    handleDeleteSale
}) => {
    const navigate = useNavigate()
    const [columnVisibility, setColumnVisibility] = useState({})
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const user = authSDK.getCurrentUser()
    const tableRef = useRef<HTMLTableElement>(null)

    useEffect(() => {
        if (!user?.name) return;
        const COLUMN_VISIBILITY_KEY = getColumnVisibilityKey(user.name);
        const savedVisibility = localStorage.getItem(COLUMN_VISIBILITY_KEY);
        if (savedVisibility) {
            try {
                const parsed = JSON.parse(savedVisibility);
                setColumnVisibility(parsed);
            } catch (error) {
                console.error('Error parsing column visibility:', error);
                localStorage.removeItem(COLUMN_VISIBILITY_KEY);
            }
        }
    }, [user?.name]);

    useEffect(() => {
        if (!user?.name || Object.keys(columnVisibility).length === 0) return;
        const COLUMN_VISIBILITY_KEY = getColumnVisibilityKey(user.name);
        try {
            localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
        } catch (error) {
            console.error('Error saving column visibility:', error);
        }
    }, [columnVisibility, user?.name]);

    const handleSeeDetails = useCallback((saleId: number) => {
        navigate(`/dashboard/sales/${saleId}`)
    }, [navigate]);

    const handleUpdateSale = useCallback((saleId: number) => {
        navigate(`/dashboard/sales/${saleId}/update`)
    }, [navigate]);

    const columns = useMemo<ColumnDef<SaleGetAll>[]>(() => [
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
            accessorKey: "nro_venta",
            header: "Nro. Venta",
            size: 120,
            minSize: 100,
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
                                    onClick={() => handleUpdateSale(row.original.id)}>
                                    <Edit className="size-4 mr-2" />
                                    Editar venta
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onKeyDown={e => e.stopPropagation()}
                                    onClick={() => handleDeleteSale(row.original.id)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Trash2 className="size-4 mr-2" />
                                    Eliminar venta
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <TooltipWrapper
                        tooltipContentProps={{
                            align: 'start'
                        }}
                        tooltip={
                            <p className="flex gap-1">Presiona <Kbd>enter</Kbd> para ver los detalles de la venta</p>
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
            size: 140,
            minSize: 120,
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
            accessorKey: "cliente",
            header: "Cliente",
            size: 250,
            minSize: 200,
            cell: ({ row }) => {
                const cliente = row.original.cliente;
                return (
                    <div className="space-y-1 flex flex-col">
                        <span className={`${!cliente ? "italic text-muted-foreground" : "font-medium text-foreground"}`}>
                            {cliente?.cliente || "Sin cliente"}
                        </span>
                        {
                            cliente &&
                            <div className="text-xs text-muted-foreground space-y-0.5">
                                {cliente.nit && <div>NIT: {cliente.nit}</div>}
                                {cliente.contacto &&
                                    <div className="flex items-center gap-1">
                                        <Phone className="size-3" />
                                        {cliente.contacto}
                                    </div>}
                            </div>
                        }
                    </div>
                );
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
            accessorKey: "contexto",
            header: "Contexto",
            size: 120,
            minSize: 100,
            cell: ({ getValue }) => {
                const contexto = getValue<string>();
                const [tipo, categoria] = contexto.split('|');
                return (
                    <div className="space-y-1 flex flex-col">
                        <Badge variant={'info'} className="text-xs w-max">
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
    ], [handleDeleteSale, handleSeeDetails, handleUpdateSale]);

    const table = useReactTable<SaleGetAll>({
        data: sales,
        columns,
        state: {
            columnVisibility,
            rowSelection,
        },
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: "onChange",
        enableColumnResizing: true,
        enableRowSelection: true,
    });

    const {
        selectedIndex,
        setSelectedIndex,
        isFocused,
        // setIsFocused: setIsFocusedTable,
        hotkeys
    } = useKeyboardNavigation<SaleGetAll, HTMLTableElement>({
        items: sales,
        containerRef: tableRef,
        onPrimaryAction: (sale) => {
            handleSeeDetails(sale.id)
        },
        getItemId: (sale) => sale.id
    });
    const handleRowClick = (index: number) => {
        setSelectedIndex(index);
    };

    const handleRowDoubleClick = (sale: SaleGetAll) => {
        handleSeeDetails(sale.id)
    };

    const hasSalesSelected = Object.keys(rowSelection).length;

    const onPageChange = (page: number) => {
        setPage(page);
    };

    const onShowRowsChange = (rows: number) => {
        updateFilter("pagina_registros", rows);
    };

    return (
        <section>
            {/* Results Info */}
            <div className="p-2 text-sm text-gray-600 border-b border-gray-200 flex items-center justify-between">
                {
                    sales.length > 0 ? (
                        isInfiniteScroll ? (
                            `Mostrando ${sales.length} de ${data?.meta?.total} ventas`
                        ) : (
                            (() => {
                                const pagina = filters.pagina ?? 1;
                                const porPagina = filters.pagina_registros ?? 1;

                                const inicio = (pagina - 1) * porPagina + 1;
                                const fin = pagina * porPagina;

                                return `Mostrando ${inicio} - ${fin} de ${data?.meta?.total} ventas`;
                            })()
                        )
                    ) : (
                        <span>Cargando...</span>
                    )
                }

                <div className="flex items-center gap-2">
                    <RowsPerPageSelect
                        value={filters.pagina_registros ?? 10}
                        onChange={onShowRowsChange}
                    />
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
                        table && hasSalesSelected > 0 && (
                            <Button size={'sm'} className="relative"
                            // onClick={handleAddSelectedToCart}
                            >
                                Proximamente...
                                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                                    {hasSalesSelected}
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
                                        <p> <ShortcutKey combo={hotkeys.primaryAction ?? ''} /> Detalle de venta </p>
                                    </div>
                                </div>
                            </div>
                        }
                    >
                        <span className="border-gray-200 border h-8 w-8 px-1 rounded-md flex items-center justify-center cursor-help hover:bg-accent">
                            <HelpCircle />
                        </span>
                    </TooltipWrapper>
                </div>
            </div>

            {isInfiniteScroll ? (
                <InfiniteScroll
                    dataLength={sales.length}
                    next={() => setPage((filters.pagina || 1) + 1)}
                    hasMore={sales.length < ((data?.meta?.total ?? 0))}
                    loader={
                        <div className="flex items-center justify-center gap-2 text-center p-6 text-xs sm:text-sm text-gray-500 bg-gray-50">
                            <Loader2 className="size-4 animate-spin" />
                            Cargando más ventas...
                        </div>
                    }
                    scrollableTarget="main-scroll-container"
                >
                    <CustomizableTable
                        table={table}
                        isError={isError}
                        errorMessage="Ocurrió un error al cargar las ventas"
                        isLoading={isLoading}
                        rows={filters.pagina_registros}
                        noDataMessage="No se encontraron ventas"
                        selectedRowIndex={selectedIndex}
                        onRowClick={handleRowClick}
                        onRowDoubleClick={handleRowDoubleClick}
                        tableRef={tableRef}
                        focused={isFocused}
                        keyboardNavigationEnabled={true}
                    />
                </InfiniteScroll>
            ) : (
                <div
                    className="overflow-auto h-full">
                    <div
                        className="overflow-x-hidden">
                        <CustomizableTable
                            table={table}
                            isError={isError}
                            isFetching={isFetching}
                            isLoading={isLoading}
                            errorMessage="Ocurrió un error al cargar las ventas"
                            noDataMessage="No se encontraron ventas"
                            rows={filters.pagina_registros}
                            selectedRowIndex={selectedIndex}
                            onRowClick={handleRowClick}
                            onRowDoubleClick={handleRowDoubleClick}
                            tableRef={tableRef}
                            focused={isFocused}
                            keyboardNavigationEnabled={true}
                        />

                    </div>

                    {/* Pagination */}
                    {
                        (data?.data?.length ?? 0) > 0 && (
                            <Pagination
                                currentPage={filters.pagina || 1}
                                onPageChange={onPageChange}
                                totalData={data?.meta?.total ?? 1}
                                onShowRowsChange={onShowRowsChange}
                                showRows={filters.pagina_registros}
                            />
                        )
                    }
                </div>
            )}
        </section>
    );
}

export default SalesListTable;