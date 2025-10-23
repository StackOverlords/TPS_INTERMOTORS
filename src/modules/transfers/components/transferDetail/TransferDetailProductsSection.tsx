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

    const columns = useMemo<ColumnDef<TransferDetailGetById>[]>(() => [
        {
            accessorKey: "id",
            header: "#ID",
            size: 50,
            minSize: 30,
            enableHiding: false,
            cell: ({ getValue }) => (
                <span className="text-center text-xs text-gray-600">{getValue<number>()}</span>
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
                        <div className="flex gap-2 text-xs text-muted-foreground">
                            {producto.codigo_oem && <span>OEM: {producto.codigo_oem}</span>}
                            {producto.codigo_upc && <span>UPC: {producto.codigo_upc}</span>}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "cantidad_entrada_salida",
            header: "Cantidad",
            size: 90,
            minSize: 80,
            cell: ({ getValue }) => {
                const value = getValue<number | null>();
                return (
                    <div className="text-center">
                        <div className="text-sm font-medium">{value ? value.toFixed(0) : '0'}</div>
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
                const cantidad = row.getValue<number | null>("cantidad_entrada_salida") ?? 0
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
        <section className="border border-gray-200 rounded-lg bg-white">
            <header className="p-4 border-b border-gray-200">
                <h3 className="text-base font-medium text-gray-900 flex gap-2 items-center">
                    <Package className="size-4" />
                    Productos de la transferencia
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                    {products.length} {products.length === 1 ? "producto" : "productos"} en total
                </p>
            </header>
            <CustomizableTable
                table={table}
                isLoading={isLoading}
                renderBottomRow={() => {
                    const colSpan = table.getVisibleFlatColumns().length;
                    return (
                        <TableRow className="bg-gray-50">
                            <TableCell colSpan={colSpan} className="p-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="text-muted-foreground font-semibold">
                                        Total de ítems: <span className="font-medium text-gray-900">{products.length}</span>
                                    </div>
                                    <div className="text-muted-foreground">
                                        <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                }}
            />
        </section>
    );
}

export default TransferDetailProductsSection;
