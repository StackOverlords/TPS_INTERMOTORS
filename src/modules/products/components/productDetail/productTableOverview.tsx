import { Badge } from "@/components/atoms/badge";
import CustomizableTable from "@/components/common/CustomizableTable";
import { formatNumber } from "@/utils/numberFormatters";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { ProductStock } from "../../types/productStock";
import { formatCurrency } from "@/utils/formaters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductTableOverviewProps {
    productStockData: ProductStock[],
    isLoading: boolean;
    isFetching: boolean
    isError: boolean,
    className?: string
}
const ProductTableOverview: React.FC<ProductTableOverviewProps> = ({
    productStockData,
    isError,
    isFetching,
    isLoading,
    className,
}) => {
    const stockTotal = productStockData.reduce((total, item) => {
        return total + item.saldo;
    }, 0);

    const columns: ColumnDef<ProductStock>[] = [
        {
            accessorKey: "fecha_adquisicion",
            header: "Fecha Entrada",
            enableHiding: false,
            minSize: 30,
            size: 80,
            cell: ({ getValue }) => {
                const rawFecha = getValue() as string;

                if (!rawFecha) return <span className="text-gray-400">Sin fecha</span>;

                const fecha = new Date(rawFecha);
                const fechaFormatted = format(fecha, "dd-MM-yyyy");

                return (
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">{fechaFormatted}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "costo",
            header: `Costo`,
            minSize: 30,
            size: 80,
            cell: ({ getValue }) => (
                <div className="text-end">
                    {formatCurrency(getValue<number>())}
                </div>
            )
        },
        {
            accessorKey: "cantidad",
            header: `Cantidad`,
            minSize: 30,
            size: 80,
            cell: ({ getValue }) => {
                const value = getValue<number>();
                return (
                    <div className="text-end">
                        {formatNumber(value)}
                    </div>
                );
            }
        },
        {
            accessorKey: "precio_venta",
            header: `Precio Venta F.`,
            minSize: 30,
            size: 80,
            cell: ({ getValue }) => {
                const value = getValue<number>();
                return (
                    <div className="text-end">
                        {formatCurrency(value)}
                    </div>
                );
            }
        },
        {
            accessorKey: "precio_venta_alt",
            header: `Precio Venta Alt.`,
            minSize: 30,
            size: 80,
            cell: ({ getValue }) => (
                <div className="text-end">
                    {formatCurrency(getValue<number>())}
                </div>
            )
        },
        {
            accessorKey: "saldo",
            header: "Stock",
            minSize: 30,
            size: 80,
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <Badge
                        variant={
                            row.original.saldo > 20 ? "success" : row.original.saldo > 10 ? "warning" : "danger"
                        }
                        className="font-semibold"
                    >
                        {row.original.saldo}
                    </Badge>
                </div>
            )
        },
        {
            accessorKey: "tipo",
            header: "Tipo",
            minSize: 30,
            size: 80,
            cell: ({ getValue }) => (
                <div className="flex items-center justify-center">
                    <Badge variant="info" className="text-xs">
                        {getValue<number>()}
                    </Badge>
                </div>
            )
        },
        {
            accessorKey: "fecha_actualizacion",
            header: "Fecha Mod Precio",
            minSize: 30,
            size: 80,
            cell: ({ getValue }) => {
                const rawFecha = getValue() as string;

                if (!rawFecha) return <span className="text-gray-400">Sin fecha</span>;

                const fecha = new Date(rawFecha);
                const fechaFormatted = format(fecha, "dd-MM-yyyy");

                return (
                    <span className="text-gray-400">{fechaFormatted}</span>
                );
            },
        },
    ];

    const table = useReactTable<ProductStock>({
        data: productStockData,
        columns,
        state: {
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: "onChange",
        enableColumnResizing: true,
        enableRowSelection: true,
    })
    return (

        <Card className={cn(
            "bg-card border border-border flex flex-col",
            className
        )}>
            <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between gap-3 text-base font-semibold text-gray-900">
                    <span className="flex items-center gap-2">
                        <ShoppingCart className="size-4 text-gray-700" />
                        Compras Disponibles
                    </span>
                    <Badge variant="secondary">
                        Stock Total: {stockTotal}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <div className="h-full">
                    <CustomizableTable
                        table={table}
                        isError={isError}
                        isFetching={isFetching}
                        isLoading={isLoading}
                        errorMessage="Ocurrió un error al cargar los productos"
                        noDataMessage="No se encontraron productos"
                    />
                </div>
            </CardContent>
        </Card>

    );
}

export default ProductTableOverview;