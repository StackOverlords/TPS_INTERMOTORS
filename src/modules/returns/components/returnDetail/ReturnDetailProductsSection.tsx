import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { formatCurrency } from "@/utils/formaters";
import CustomizableTable from "@/components/common/CustomizableTable";
import { formatCell } from "@/utils/formatCell";
import { TableCell, TableRow } from "@/components/atoms/table";
import { Package } from "lucide-react";
import type { ReturnDetailGetById } from "../../types/returnGet.types";
import { cn } from "@/lib/utils";

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

    const columns = useMemo<ColumnDef<ReturnDetailGetById>[]>(() => [
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
            accessorKey: "cantidad",
            header: "Cantidad",
            size: 90,
            minSize: 80,
            cell: ({ getValue }) => {
                return (
                    <div className="text-center">
                        <div className="text-sm font-medium">{getValue<number>().toFixed(0)}</div>
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
                    Productos de la devolución
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

export default ReturnDetailProductsSection;