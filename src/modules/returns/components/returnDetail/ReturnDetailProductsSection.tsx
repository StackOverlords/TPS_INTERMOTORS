import { TableCell, TableRow } from "@/components/atoms/table";
import CustomizableTable from "@/components/common/CustomizableTable";
import { cn } from "@/lib/utils";
import { formatCell } from "@/utils/formatCell";
import { formatCurrency } from "@/utils/formaters";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Package, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReturnDetailGetById } from "../../types/returnGet.types";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";

interface ReturnDetailProductsSectionProps {
    products: ReturnDetailGetById[],
    isLoading: boolean,
    totalAmount: number
}
const ReturnDetailProductsSection: React.FC<ReturnDetailProductsSectionProps> = ({
    isLoading,
    products,
    totalAmount
}) => {
    const SEARCH_MODE: "realtime" | "manual" = "manual";
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const isManual = SEARCH_MODE === "manual";

    const handleSearch = () => {
        if (isManual) setSearchTerm(searchInput.trim());
    };

    const normalizedProducts = useMemo(() => {
        return products
            .map((item, index) => ({
                ...item,
                orden: item.orden ?? index + 1  // Asigna orden secuencial si es null
            }))
            .sort((a, b) => a.orden - b.orden); // Siempre ordenar por orden
    }, [products]);

    // Cuando el modo es realtime, el término de búsqueda es el input directamente
    const termToFilter = isManual ? searchTerm : searchInput;

    const filteredReturnItems = useMemo(() => {
        return normalizedProducts.filter(item =>
            (item.producto ?? "").toLowerCase().includes(termToFilter.toLowerCase())
        );
    }, [normalizedProducts, termToFilter]);

    // Calcular total de cantidades
    const totalCantidad = useMemo(() => {
        return filteredReturnItems.reduce((total, product) => {
            const cantidad = typeof product.cantidad === "string"
                ? parseFloat(product.cantidad)
                : product.cantidad;
            return total + (isFinite(cantidad) ? cantidad : 0);
        }, 0);
    }, [filteredReturnItems]);

    const filteredTotalAmount = useMemo(() => {
        return filteredReturnItems.reduce((total, product) => {
            const cantidad =
                typeof product.cantidad === "string"
                    ? parseFloat(product.cantidad)
                    : product.cantidad;

            const costo = (product.costo ?? 0);
            const subtotal = costo * cantidad;

            return total + subtotal;
        }, 0);
    }, [filteredReturnItems]);

    const finalTotal = termToFilter.trim()
        ? filteredTotalAmount
        : totalAmount;


    const columns = useMemo<ColumnDef<ReturnDetailGetById>[]>(() => [
        {
            accessorKey: "orden",
            header: "N°",
            size: 30,
            minSize: 20,
        },
        {
            accessorKey: "id",
            header: "Cód",
            size: 50,
            minSize: 30,
            enableHiding: false,
            cell: ({ getValue }) => (
                <span className="text-center text-xs text-muted-foreground">{getValue<number>()}</span>
            ),
        },
        {
            accessorKey: "producto",
            header: "Descripción",
            size: 200,
            cell: ({ getValue }) => {
                const descripcion = getValue<string>();
                return (
                    <span className={cn(
                        !descripcion && "text-muted-foreground italic"
                    )}>
                        {formatCell(descripcion)}
                    </span>
                )
            }
        },
        {
            accessorKey: "cantidad",
            header: "Cantidad",
            size: 90,
            minSize: 80,
            cell: ({ row }) => {
                const cantidad = typeof row.original.cantidad === "string"
                    ? parseFloat(row.original.cantidad)
                    : row.original.cantidad;
                const cantidadDisplay = isFinite(cantidad) ? cantidad.toFixed(0) : "0";

                return (
                    <div className="text-center">
                        <div className="text-sm font-medium">{cantidadDisplay}</div>
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: "costo",
            header: "Costo",
            size: 90,
            minSize: 80,
            cell: ({ getValue, row }) => {
                const product = row.original
                const value = getValue<number>()
                return (
                    <div className="text-center">
                        <span className="text-xs font-medium">
                            {formatCurrency(value, { currency: product.moneda })}
                        </span>
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            id: "subtotal",
            header: "Subtotal",
            size: 80,
            minSize: 70,
            cell: ({ row }) => {
                const product = row.original
                const subtotal = (product.costo ?? 0) * product.cantidad

                return (
                    <div className="text-right font-bold text-emerald-600">
                        {formatCurrency(subtotal, { currency: product.moneda })}
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: 'comentario',
            header: 'Comentarios',
            size: 110,
            minSize: 100,
            cell: ({ getValue }) => {
                const comentarios = getValue<string>();
                return (
                    <span className={cn(
                        !comentarios && "text-muted-foreground italic"
                    )}>
                        {formatCell(comentarios)}
                    </span>
                )
            }
        },
        {
            accessorKey: 'almacen_out_det_id',
            header: 'Det. ID',
            size: 50
        },
        {
            accessorKey: 'almacen_out_dev_id',
            header: 'Dev. ID',
            size: 50
        },
    ], []);

    const table = useReactTable<ReturnDetailGetById>({
        data: filteredReturnItems,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: "onChange",
        enableColumnResizing: true,
        enableRowSelection: true,
    })

    return (
        <section className="border border-border rounded-lg bg-card flex-1 flex flex-col overflow-hidden">
            <header className="p-2 border-b border-border flex-shrink-0 space-y-1">
                <h3 className="text-base font-medium text-primary flex gap-2 items-center">
                    <Package className="size-4" />
                    Productos de la devolución
                </h3>
                <p className="text-xs text-muted-foreground">
                    {filteredReturnItems.length} {filteredReturnItems.length === 1 ? "producto" : "productos"} en total
                </p>

                <div className="flex gap-2 w-full lg:w-1/2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar producto por descripción..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className={cn(
                                "pl-10",
                                searchInput.trim() !== "" && "pr-10"
                            )}
                        />
                        {searchInput.trim() !== "" && (
                            <Button
                                variant={'outline'}
                                onClick={() => {
                                    setSearchInput("");
                                    if (isManual) setSearchTerm(""); // reset también en manual
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 size-6 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent hover:border-destructive/30"
                            >
                                <X className="size-3" />
                            </Button>
                        )}
                    </div>

                    {isManual && (
                        <Button onClick={handleSearch}>
                            <Search className="size-4" />
                            Buscar
                        </Button>
                    )}
                </div>
            </header>
            <div className="flex-1 overflow-auto">
                <CustomizableTable
                    table={table}
                    isLoading={isLoading}
                    stickyHeader={true}
                    rows={filteredReturnItems.length}
                    renderBottomRow={() => (
                        <TableRow className="bg-accent/30 font-semibold sticky bottom-0 hover:bg-accent/30">
                            {table.getVisibleFlatColumns().map((column) => {
                                if (column.id === 'cantidad') {
                                    return (
                                        <TableCell key={column.id} className="text-center p-1">
                                            <div className="text-xs text-muted-foreground mb-0.5">Total Cantidad</div>
                                            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                {totalCantidad.toFixed(0)}
                                            </div>
                                        </TableCell>
                                    );
                                }
                                if (column.id === 'subtotal') {
                                    return (
                                        <TableCell key={column.id} className="text-right p-1">
                                            <div className="text-xs text-muted-foreground mb-0.5">Total</div>
                                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(finalTotal)}
                                            </div>
                                        </TableCell>
                                    );
                                }
                                return <TableCell key={column.id} />;
                            })}
                        </TableRow>
                    )}
                />
            </div>
        </section>
    );
}

export default ReturnDetailProductsSection;