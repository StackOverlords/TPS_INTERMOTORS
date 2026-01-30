import { TableCell, TableRow } from "@/components/atoms/table";
import CustomizableTable from "@/components/common/CustomizableTable";
import { cn } from "@/lib/utils";
import { formatCell } from "@/utils/formatCell";
import { formatCurrency } from "@/utils/formaters";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Package } from "lucide-react";
import { useMemo } from "react";
import type { TransferDetailGetById } from "../../types/transferGet.types";

interface TransferDetailProductsSectionProps {
    products: TransferDetailGetById[],
    isLoading: boolean,
    totalAmount: number
}
const TransferDetailProductsSection: React.FC<TransferDetailProductsSectionProps> = ({
    isLoading,
    products,
    totalAmount
}) => {

    // Calcular total de cantidades
    const totalCantidad = useMemo(() => {
        return products.reduce((total, product) => {
            const cantidad = product.cantidad ? parseFloat(product.cantidad) : 0;
            return total + cantidad;
        }, 0);
    }, [products]);

    const columns = useMemo<ColumnDef<TransferDetailGetById>[]>(() => [
        // {
        //     accessorKey: "id",
        //     header: "#ID",
        //     size: 50,
        //     minSize: 30,
        //     enableHiding: false,
        //     cell: ({ getValue }) => (
        //         <span className="text-center text-xs text-muted-foreground">{getValue<number>()}</span>
        //     ),
        // },
        {
            header: "Nro.",
            size: 50,
            minSize: 30,
            enableHiding: false,
            cell: ({ row }) => (
                <span className="text-center text-xs text-muted-foreground">{row.index + 1}</span>
            ),
        },
        {
            accessorKey: "producto",
            header: "Producto",
            size: 250,
            minSize: 200,
            cell: ({ row }) => {
                const producto = row.original.producto;
                return (
                    <div className="space-y-1">
                        <p className="font-medium text-sm">{producto.descripcion}</p>
                        {/* <div className="flex gap-2 text-xs text-muted-foreground">
                            {producto.codigo_oem && <span>OEM: {producto.codigo_oem}</span>}
                            {producto.codigo_upc && <span>UPC: {producto.codigo_upc}</span>}
                        </div> */}
                    </div>
                );
            },
        },
        {
            header: "Cod. OEM",
            accessorKey: "producto.codigo_oem",
            size: 120,
            minSize: 100,
            cell: ({ getValue }) => {
                const codigoOem = getValue<string | null>();
                return (
                    <span className={cn(
                        "text-xs",
                        !codigoOem && "text-muted-foreground italic"
                    )}>
                        {formatCell(codigoOem)}
                    </span>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: "cantidad",
            header: "Cantidad",
            size: 90,
            minSize: 80,
            cell: ({ getValue }) => {
                const value = getValue<string | null>();
                const cantidad = value ? parseFloat(value) : 0;
                return (
                    <div className="text-center">
                        <div className="text-sm font-medium">{cantidad.toFixed(0)}</div>
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: "costo_entrada",
            header: "Costo",
            size: 100,
            minSize: 80,
            cell: ({ getValue }) => {
                const value = getValue<number | null>()
                return (
                    <div className="text-center">
                        <span className="text-xs font-medium">
                            {formatCurrency(value ?? 0)}
                        </span>
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: "precio_salida",
            header: "Precio Salida",
            size: 100,
            minSize: 80,
            cell: ({ getValue }) => {
                const value = getValue<number | null>()
                return (
                    <div className="text-center">
                        <span className="text-xs font-medium">
                            {formatCurrency(value ?? 0)}
                        </span>
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: "precio_entrada_venta",
            header: "Precio Entrada",
            size: 100,
            minSize: 80,
            cell: ({ getValue }) => {
                const value = getValue<number | null>()
                return (
                    <div className="text-center">
                        <span className="text-xs font-medium">
                            {formatCurrency(value ?? 0)}
                        </span>
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            id: "subtotal",
            header: "Subtotal",
            size: 100,
            minSize: 80,
            cell: ({ row }) => {
                const product = row.original
                const cantidadValue = row.getValue<string | null>("cantidad");
                const cantidad = cantidadValue ? parseFloat(cantidadValue) : 0;
                const subtotal = (Number(product.costo_entrada) ?? 0) * cantidad

                return (
                    <div className="text-right font-bold text-emerald-600">
                        {formatCurrency(subtotal)}
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: 'comentario',
            header: 'Comentarios',
            size: 150,
            minSize: 100,
            cell: ({ getValue }) => {
                const comentarios = getValue<string | null>();
                return (
                    <span className={cn(
                        "text-xs",
                        !comentarios && "text-muted-foreground italic"
                    )}>
                        {formatCell(comentarios)}
                    </span>
                )
            }
        },
    ], []);

    const table = useReactTable<TransferDetailGetById>({
        data: products,
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
            <header className="p-4 border-b border-border flex-shrink-0">
                <h3 className="text-base font-medium text-foreground flex gap-2 items-center">
                    <Package className="size-4" />
                    Productos de la transferencia
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                    {products.length} {products.length === 1 ? "producto" : "productos"} en total
                </p>
            </header>
            <div className="flex-1 overflow-auto">
                <CustomizableTable
                table={table}
                isLoading={isLoading}
                stickyHeader={true}
                renderBottomRow={() => (
                    <TableRow className="bg-accent/30 font-semibold sticky bottom-0">
                        {table.getVisibleFlatColumns().map((column) => {
                            if (column.id === 'cantidad') {
                                return (
                                    <TableCell key={column.id} className="text-center">
                                        <div className="text-xs text-muted-foreground mb-0.5">Total Cantidad</div>
                                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {totalCantidad.toFixed(0)}
                                        </div>
                                    </TableCell>
                                );
                            }
                            if (column.id === 'subtotal') {
                                return (
                                    <TableCell key={column.id} className="text-right">
                                        <div className="text-xs text-muted-foreground mb-0.5">Total</div>
                                        <div className="text-sm font-bold text-emerald-600">
                                            {formatCurrency(totalAmount)}
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

export default TransferDetailProductsSection;
