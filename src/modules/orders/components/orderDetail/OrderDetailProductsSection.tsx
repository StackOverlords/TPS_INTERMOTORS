import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { formatCurrency } from "@/utils/formaters";
import CustomizableTable from "@/components/common/CustomizableTable";
import { Badge } from "@/components/atoms/badge";
import { formatCell } from "@/utils/formatCell";
import { TableCell, TableRow } from "@/components/atoms/table";
import { Package } from "lucide-react";
import type { OrderDetailGetById } from "../../types/orderGet.types";

interface OrderDetailProductsSectionProps {
    products: OrderDetailGetById[],
    isLoading: boolean,
    totalAmount: number
}
const OrderDetailProductsSection: React.FC<OrderDetailProductsSectionProps> = ({
    isLoading,
    products,
    totalAmount
}) => {

    const columns = useMemo<ColumnDef<OrderDetailGetById>[]>(() => [
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
            accessorFn: row => row.producto.descripcion,
            id: "descripcion",
            header: "Descripción",
            size: 300,
            minSize: 200,
            cell: ({ getValue, row }) => {
                const product = row.original.producto
                const descripcion = getValue<string>()
                return (
                    <div className="space-y-0.5">
                        <h3 title="Descripción" className="text-sm font-medium text-gray-900 leading-tight truncate">
                            {descripcion}
                        </h3>

                        <div className="flex flex-wrap gap-1 mt-1">
                            {product.categoria && (
                                <Badge variant="accent" title="Categoria" className="text-[10px] border-gray-300">{product.categoria.categoria}</Badge>
                            )}
                            {product.marca && (
                                <Badge variant="outline" title="Marca" className="text-[10px] border-gray-300"> {product.marca.marca}</Badge>
                            )}
                        </div>
                    </div>
                )
            },
        },
        {
            accessorFn: row => row.producto.codigo_upc,
            id: "codigo_upc",
            header: "Código UPC/OEM",
            size: 130,
            minSize: 80,
            cell: ({ getValue, row }) => (
                <div className="space-y-0.5">
                    <div className="font-mono text-xs text-gray-900 truncate">
                        {formatCell(getValue<string>())}
                    </div>
                    {row.original.producto.codigo_oem && (
                        <div title="Código OEM" className="font-mono text-xs text-gray-500 truncate">
                            OEM: {row.original.producto.codigo_oem}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "cantidad",
            header: "Cantidad",
            size: 90,
            minSize: 80,
            cell: ({ row, getValue }) => {
                const product = row.original.producto
                return (
                    <div className="text-center">
                        <div className="text-sm font-medium">{getValue<number>().toFixed(0)}</div>
                        {product.unidad_medida && (
                            <div className="text-[10px] text-gray-500">{product.unidad_medida.unidad_medida}</div>
                        )}
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
            accessorKey: "inc_precio_venta",
            header: "Inc. %",
            size: 90,
            minSize: 80,
            cell: ({ getValue }) => {
                return (
                    <div className="text-center">
                        <span className="text-xs font-medium">{getValue<number>()?.toFixed(2)}%</span>
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: "precio_venta",
            id: 'precio_venta',
            header: "P. Venta",
            size: 110,
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
            accessorKey: "inc_precio_venta_alt",
            id: 'inc_p_venta_alt',
            header: "Inc. Alt %",
            size: 110,
            minSize: 80,
            cell: ({ getValue }) => {
                return (
                    <div className="text-center">
                        <span className="text-xs font-medium">{getValue<number>()?.toFixed(2)}%</span>
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: "precio_venta_alt",
            id: 'precio_venta_alt',
            header: "P. Venta Alt",
            size: 110,
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
                const subtotal = product.costo * product.cantidad

                return (
                    <div className="text-right font-bold text-emerald-600">
                        {formatCurrency(subtotal, { currency: product.moneda })}
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
    ], []);

    const table = useReactTable<OrderDetailGetById>({
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
        <section className="border border-gray-200 rounded-lg">
            <header className="p-4 border-b border-gray-200">
                <h3 className="text-base font-medium text-gray-900 flex gap-2 items-center">
                    <Package className="size-4" />
                    Productos del Pedido
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

export default OrderDetailProductsSection;