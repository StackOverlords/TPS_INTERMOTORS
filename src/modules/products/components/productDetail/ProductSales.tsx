import { Badge } from "@/components/atoms/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ProductSalesItem, ProductSalesStats } from "../../types/ProductSalesStats";
import CustomizableTable from "@/components/common/CustomizableTable";
import { TableCell, TableRow } from "@/components/atoms/table";
import { YearSelector } from "@/components/common/YearSelector";

interface ProductSalesProps {
    gestion_1: number;
    gestion_2: number;
    handleChangeGestion1: (value: string) => void
    handleChangeGestion2: (value: string) => void
    productSalesData: ProductSalesStats
    isLoadingData: boolean,
    isFetchingData: boolean
    isErrorData: boolean
}
const ProductSales: React.FC<ProductSalesProps> = ({
    gestion_1,
    gestion_2,
    handleChangeGestion1,
    handleChangeGestion2,
    productSalesData,
    isLoadingData,
    isErrorData,
    isFetchingData
}) => {
    // Calcular totales y métricas
    const totalVentasActual = productSalesData?.data.reduce((sum, venta) => sum + venta.gestion_2, 0) ?? 0
    const totalVentasAnterior = productSalesData?.data.reduce((sum, venta) => sum + venta.gestion_1, 0) ?? 0
    const diferenciaTotalVentas = (totalVentasActual ?? 0) - (totalVentasAnterior ?? 0) || 0
    const columns: ColumnDef<ProductSalesItem>[] = [
        {
            accessorKey: "mes",
            header: "Mes",
            enableHiding: false,
            size:80,
            minSize: 60,
        },
        {
            accessorKey: "gestion_1",
            header: `Gestion ${gestion_1}`,
            size:80,
            minSize: 60,
            cell: ({ getValue }) => {
                const value = getValue<number>();
                return (
                    <div className="text-end">
                        {value.toLocaleString()}
                    </div>
                );
            }
        },
        {
            accessorKey: "gestion_2",
            header: `Gestion ${gestion_2}`,
            size:80,
            minSize: 60,
            cell: ({ getValue }) => {
                const value = getValue<number>();
                return (
                    <div className="text-end">
                        {value.toLocaleString()}
                    </div>
                );
            }
        },
        {
            id: "diferencia",
            header: "Diferencia",
            size:80,
            minSize: 60,
            cell: ({ row }) => {
                const diferencia = row.original.gestion_2 - row.original.gestion_1;
                return (
                    <div className="flex items-center justify-end gap-1">
                        <Badge variant={diferencia === 0 ? "secondary" : diferencia > 0 ? "success" : "danger"}>
                            {Math.abs(diferencia)}
                        </Badge>
                        {diferencia >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                    </div>
                )
            }
        },
        {
            id: "porcentaje_cambio",
            header: "% Cambio",
            size:80,
            minSize: 60,
            cell: ({ row }) => {
                const porcentajeCambio = row.original.gestion_1 > 0 ? ((row.original.gestion_2 - row.original.gestion_1) / row.original.gestion_1 * 100) : 0.00;
                return (
                    <div className="flex items-center justify-end gap-1">
                        <Badge
                            variant={porcentajeCambio === 0 ? "secondary" : porcentajeCambio > 0 ? "success" : "danger"}
                            className="font-semibold"
                        >
                            {porcentajeCambio >= 0 ? "+" : ""}
                            {porcentajeCambio.toFixed(2)}%
                        </Badge>
                    </div>
                )
            }
        },
    ];

    const table = useReactTable<ProductSalesItem>({
        data: productSalesData.data,
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
        <Card className="bg-white border border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <TrendingUp className="size-4 text-gray-700" />
                    Análisis de Ventas Anuales
                    <div className="flex items-center ml-auto gap-4">
                        <YearSelector
                            value={gestion_1.toString()}
                            onValueChange={handleChangeGestion1}
                        />
                        <YearSelector
                            value={gestion_2.toString()}
                            onValueChange={handleChangeGestion2}
                        />
                        <Badge variant={diferenciaTotalVentas >= 0 ? "default" : "danger"}>
                            {diferenciaTotalVentas >= 0 ? "+" : ""}
                            {diferenciaTotalVentas} vs año anterior
                        </Badge>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <CustomizableTable
                        table={table}
                        isLoading={isLoadingData}
                        isError={isErrorData}
                        isFetching={isFetchingData}
                        renderBottomRow={() => (
                            !isErrorData && !isLoadingData && !isFetchingData &&
                            <TableRow className="bg-gray-50 font-bold">
                                <TableCell className="font-bold p-1">TOTAL</TableCell>
                                <TableCell className="font-bold p-1 text-gray-900 text-end">
                                    {totalVentasAnterior.toLocaleString()}
                                </TableCell>
                                <TableCell className="font-bold p-1  text-gray-600 text-end">
                                    {totalVentasActual.toLocaleString()}
                                </TableCell>
                                <TableCell className="px-0">
                                    <div className="flex items-center justify-end gap-1 p-1">
                                        <Badge
                                            variant={diferenciaTotalVentas > 0 ? "success" : diferenciaTotalVentas === 0 ? "secondary" : "danger"}
                                            className="font-bold"
                                        >
                                            {Math.abs(diferenciaTotalVentas)}
                                        </Badge>
                                        {diferenciaTotalVentas >= 0 ? (
                                            <TrendingUp className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-600" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right p-1">
                                    <Badge variant={diferenciaTotalVentas > 0 ? "success" : diferenciaTotalVentas === 0 ? "secondary" : "danger"} className="font-bold">
                                        {diferenciaTotalVentas >= 0 ? "+" : ""}
                                        {totalVentasAnterior > 0
                                            ? ((diferenciaTotalVentas / totalVentasAnterior) * 100).toFixed(2)
                                            : 0.00.toFixed(2)}
                                        %
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

export default ProductSales;