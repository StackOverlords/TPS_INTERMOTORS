import { Badge } from "@/components/atoms/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { TabsContent } from "@/components/atoms/tabs";
import CustomizableTable from "@/components/common/CustomizableTable";
import { formatPrice } from "@/utils/numberFormatters";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Building2 } from "lucide-react";
import type { ProductStock } from "../../types/productStock";

interface ProductInventoryProps {
    productStockData: ProductStock[]
    isLoadingData: boolean
    isErrorData: boolean
}
const ProductInventory: React.FC<ProductInventoryProps> = ({
    productStockData,
    isErrorData,
    isLoadingData
}) => {

    const columns: ColumnDef<ProductStock>[] = [
        {
            accessorKey: "fecha_adquisicion",
            header: "Fecha",
            enableHiding: false,
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
            accessorKey: "saldo",
            header: "Stock",
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <Badge
                        variant={
                            row.original.saldo > 15 ? "success" : row.original.saldo > 5 ? "warning" : "danger"
                        }
                        className="font-semibold"
                    >
                        {row.original.saldo}
                    </Badge>
                </div>
            )
        },
        {
            accessorKey: "costo",
            header: `Costo`,
            cell: ({ getValue }) => (
                <div className="text-end">
                    {formatPrice(getValue<number>())}
                </div>
            )
        },
        {
            accessorKey: "cantidad",
            header: `Cantidad`,
            cell: ({ getValue }) => {
                const value = getValue<number>();
                return (
                    <div className="text-end">
                        {value}
                    </div>
                );
            }
        },
        {
            accessorKey: "precio_venta",
            header: `Precio Venta F.`,
            cell: ({ getValue }) => {
                const value = getValue<number>();
                return (
                    <div className="text-end">
                        ${formatPrice(value)}
                    </div>
                );
            }
        },
        {
            accessorKey: "precio_venta_alt",
            header: `Precio Venta Alt.`,
            cell: ({ getValue }) => {
                const value = getValue<number>();
                return (
                    <div className="text-end">
                        ${formatPrice(value)}
                    </div>
                );
            }
        },
        {
            accessorKey: "sucursal",
            header: "Sucursal",
            cell: ({ getValue }) => (
                <div className="flex items-center justify-center">
                    <Badge
                        variant={"outline"}
                        className="font-semibold"
                    >
                        {getValue<string>()}
                    </Badge>
                </div>
            )
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
        <TabsContent value="inventory" className="space-y-8">
            <Card className="bg-white border border-gray-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                        <Building2 className="h-5 w-5 text-gray-700" />
                        Detalle disponibles en otras sucursales
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <CustomizableTable
                            table={table}
                            isLoading={isLoadingData}
                            isError={isErrorData}
                        />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    );
}

export default ProductInventory;