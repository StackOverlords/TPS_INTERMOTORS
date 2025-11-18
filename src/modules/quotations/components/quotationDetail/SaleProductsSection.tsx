import { Badge } from "@/components/atoms/badge";
import { TableCell, TableRow } from "@/components/atoms/table";
import CustomizableTable from "@/components/common/CustomizableTable";
import { formatCell } from "@/utils/formatCell";
import { formatCurrency } from "@/utils/formaters";
import { formatNumber } from "@/utils/numberFormatters";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Package } from "lucide-react";
import { useMemo } from "react";
import type { QuotationItemGetById } from "../../types/quotationGet.types";

interface QuotationProductsSectionProps {
    products: QuotationItemGetById[],
    isLoading: boolean,
    totalAmount: number
}
const QuotationProductsSection: React.FC<QuotationProductsSectionProps> = ({
    isLoading,
    products,
    totalAmount
}) => {

    // Calcular total de cantidades
    const totalCantidad = useMemo(() => {
        return products.reduce((total, product) => {
            const cantidad = typeof product.cantidad === "string"
                ? parseFloat(product.cantidad)
                : product.cantidad;
            return total + (isFinite(cantidad) ? cantidad : 0);
        }, 0);
    }, [products]);

    const columns = useMemo<ColumnDef<QuotationItemGetById>[]>(() => [
        {
            accessorKey: "id",
            header: "#ID",
            size: 35,
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
            minSize: 40,
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
                            {product.procedencia && (
                                <Badge variant="outline" title="Procedencia" className="text-[10px] border-gray-300">{product.procedencia.procedencia}</Badge>
                            )}
                            {product.marca_vehiculo && (
                                <Badge variant="secondary" title="Marca Vehículo" className="text-[10px]">{product.marca_vehiculo.marca_vehiculo}</Badge>
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
            size: 100,
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
            cell: ({ row }) => {
                const product = row.original.producto;
                const cantidad = typeof row.original.cantidad === "string"
                    ? parseFloat(row.original.cantidad)
                    : row.original.cantidad;
                const cantidadDisplay = isFinite(cantidad) ? cantidad.toFixed(0) : "0";

                return (
                    <div className="text-center">
                        <div className="text-sm font-medium">{cantidadDisplay}</div>
                        {product.unidad_medida && (
                            <div className="text-[10px] text-gray-500">{product.unidad_medida.unidad_medida}</div>
                        )}
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: "precio",
            header: "Precio U.",
            size: 80,
            minSize: 70,
            cell: ({ getValue, row }) => (
                <div className="font-medium flex items-center justify-end">
                    {formatCurrency(getValue<number>(), { currency: row.original.monenda })}
                </div>
            ),
            sortingFn: "alphanumeric",
        },
        {
            accessorKey: "descuento",
            header: "Descuento",
            size: 80,
            minSize: 70,
            cell: ({ getValue, row }) => {
                const discountPercent = formatNumber(row.original.porcentaje_descuento);
                return (
                    <div className="font-medium flex items-end justify-center flex-col">
                        {
                            discountPercent && (
                                <span className="text-red-500">
                                    {discountPercent}%
                                </span>
                            )
                        }
                        <span>{formatCurrency(getValue<number>(), { currency: row.original.monenda })}</span>
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
                const subtotal = product.precio * product.cantidad
                const descuento =
                    product.porcentaje_descuento != null
                        ? (1 - product.porcentaje_descuento / 100)
                        : 1;
                const total = subtotal * descuento

                return (
                    <div className="text-right font-bold text-emerald-600">
                        {formatCurrency(total, { currency: product.monenda })}
                    </div>
                )
            },
            sortingFn: "alphanumeric",
        },
    ], []);

    const table = useReactTable<QuotationItemGetById>({
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
        <section className="border border-gray-200 rounded-lg bg-white flex-1 flex flex-col overflow-hidden">
            <header className="p-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-base font-medium text-gray-900 flex gap-2 items-center">
                    <Package className="size-4" />
                    Productos de la cotizacion
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                    {products.length} {products.length === 1 ? "producto" : "productos"} en total
                </p>
            </header>
            <div className="flex-1 overflow-auto">
                <CustomizableTable
                    table={table}
                    isLoading={isLoading}
                    stickyHeader={true}
                    renderBottomRow={() => (
                        <TableRow className="bg-gray-50 font-semibold sticky bottom-0">
                            {table.getVisibleFlatColumns().map((column) => {
                                if (column.id === 'cantidad') {
                                    return (
                                        <TableCell key={column.id} className="text-center">
                                            <div className="text-xs text-muted-foreground mb-0.5">Total Cantidad</div>
                                            <div className="text-sm font-bold text-blue-600">
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

export default QuotationProductsSection;