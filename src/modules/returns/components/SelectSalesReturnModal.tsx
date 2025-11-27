import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/atoms/dialog";
import { Input } from "@/components/atoms/input";
import { Skeleton } from "@/components/atoms/skeleton";
import { TableCell, TableRow } from "@/components/atoms/table";
import CustomizableTable from "@/components/common/CustomizableTable";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { useCustomTable } from "@/hooks/useCustomTable";
import { cn } from "@/lib/utils";
import { useSaleGetById } from "@/modules/sales/hooks/useSaleGetById";
import type { SaleItemGetById } from "@/modules/sales/types/salesGetResponse";
import { formatCurrency, formatDate } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import { Calculator, CalendarDays, Check, Plus, Search, User } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface SelectSalesReturnModalProps {
    saleId: number | null;
    isDialogOpen: boolean;
    onCloseDialog: (open: boolean) => void;
    selectedProducts: { almacen_out_det_id: number, cantidad: number }[];
    onProductSelect: (product: SaleItemGetById, saleId: number) => void;
    onConfirm?: () => void;
}
const SelectSalesReturnModal: React.FC<SelectSalesReturnModalProps> = ({
    saleId,
    isDialogOpen,
    onCloseDialog,
    selectedProducts,
    onProductSelect,
    onConfirm,
}) => {

    const [searchSaleDetail, setSearchSaleDetail] = useState<string>("")

    const {
        data: saleData,
        isLoading: isLoadingSale,
        isError: isErrorSale
    } = useSaleGetById(Number(saleId))

    const filteredSaleDetailData = useMemo(() => {
        return saleData?.detalles.filter(item =>
            item.producto.descripcion.toLowerCase().includes(searchSaleDetail.toLowerCase())
        );
    }, [saleData, searchSaleDetail]);

    // Verificar si un producto ya está seleccionado
    const isProductSelected = useCallback(
        (productId: number) => {
            const item = selectedProducts.find(
                p => (p.almacen_out_det_id === productId)
            );

            return {
                isSelected: !!item,
                item,
            };
        },
        [selectedProducts]
    );

    const columns = useMemo<ColumnDef<SaleItemGetById>[]>(() => [
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
            size: 250,
            minSize: 200,
            cell: ({ getValue, row }) => {
                const product = row.original.producto
                const descripcion = getValue<string>()
                return (
                    <div className="space-y-0.5">
                        <h3 title="Descripción" className="text-xs font-medium text-primary leading-tight truncate">
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
            accessorKey: "cantidad",
            header: "Cantidad",
            size: 90,
            minSize: 80,
            cell: ({ row, getValue }) => {
                const product = row.original.producto
                const cantidad = typeof getValue() === "string"
                    ? parseFloat(getValue() as string)
                    : getValue<number>();
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
                const porcentaje = row.original.porcentaje_descuento;
                const discountPercent = typeof porcentaje === "string"
                    ? parseFloat(porcentaje)
                    : porcentaje;
                const discountPercentDisplay = isFinite(discountPercent) ? discountPercent.toFixed(2) : null;

                return (
                    <div className="font-medium flex items-end justify-center flex-col">
                        {
                            discountPercentDisplay && (
                                <span className="text-red-500">
                                    {discountPercentDisplay}%
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
        {
            id: 'actions',
            header: 'Acciones',
            size: 100,
            cell: ({ row }) => {
                const product = row.original

                const {
                    isSelected,
                    item
                } = isProductSelected(row.original.id);

                const quantity = item && "cantidad" in item ? item.cantidad : null
                const isOutOfStock = quantity != null ?
                    (isSelected && quantity >= product.cantidad) :
                    isSelected

                return (
                    <Button
                        type='button'
                        size="sm"
                        variant={isSelected ? 'outline' : 'default'}
                        disabled={isOutOfStock}
                        onClick={() => onProductSelect(product, saleId || 0)}
                        className='h-7 text-xs'
                    >
                        {isOutOfStock ? (
                            <>
                                <Check className="size-3" />
                                Agregado
                            </>
                        ) : isSelected && quantity != null ? (
                            <>
                                {quantity} Agregados
                            </>
                        ) : (
                            <>
                                <Plus className="size-3" />
                                Agregar
                            </>
                        )}
                    </Button>
                );
            },
        },
    ], [isProductSelected, onProductSelect]);

    const {
        table,
        // resetAll,
    } = useCustomTable({
        data: filteredSaleDetailData ?? [],
        columns,

        // Configuración de características
        enableSorting: true,
        enableColumnResizing: true,
        enableRowSelection: true,
        enableColumnVisibility: true,
        enableColumnOrdering: true,
        enablePagination: false,

        // Configuración de resize
        columnResizeMode: "onChange",

        // Persistencia con key única por usuario
        // persistenceKey: `returns-select-detail-table-${user?.name}`,
        // persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    const totalAmount = useMemo(() => {
        return filteredSaleDetailData?.reduce((total, item) => {
            const subtotal = item.precio * item.cantidad;
            const descuento = item.porcentaje_descuento != null
                ? (1 - item.porcentaje_descuento / 100)
                : 1;
            return total + subtotal * descuento;
        }, 0) ?? 0;
    }, [filteredSaleDetailData]);

    return (
        <Dialog open={isDialogOpen} onOpenChange={onCloseDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Seleccionar Productos • Venta {saleData?.nro}</DialogTitle>
                </DialogHeader>

                <DialogDescription asChild>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {
                                isLoadingSale ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <Skeleton key={index} className="w-full h-8" />
                                    ))
                                ) : (
                                    <>
                                        <h3 className={cn(
                                            "font-semibold text-primary flex items-center gap-2",
                                            !saleData?.cliente && "text-muted-foreground italic font-normal"
                                        )}>
                                            <User className="size-4" />
                                            {saleData?.cliente ? saleData?.cliente?.cliente : 'Sin cliente'}
                                        </h3>
                                        <p className="text-muted-foreground flex items-center gap-2">
                                            <CalendarDays className="size-4" />
                                            {formatDate(saleData?.fecha ?? '')}
                                        </p>
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Calculator className="size-4" />
                                            {saleData?.cantidad_detalles} productos
                                        </span>
                                    </>
                                )
                            }
                        </div>
                        {/* Search Sales */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar producto por descripción..."
                                value={searchSaleDetail}
                                onChange={(e) => setSearchSaleDetail(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </DialogDescription>

                <div className="space-y-2">
                    {
                        isErrorSale ? (
                            <ErrorDataComponent
                                errorMessage="No se pudo cargar la venta."
                            />
                        ) : (
                            <>
                                <CustomizableTable
                                    table={table}
                                    isLoading={isLoadingSale}
                                    rows={filteredSaleDetailData?.length}
                                    renderBottomRow={() => {
                                        const colSpan = table.getVisibleFlatColumns().length;
                                        return (
                                            <TableRow className="bg-gray-50">
                                                <TableCell colSpan={colSpan} className="p-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="text-gray-500">
                                                            Total de ítems: <span className="font-medium text-gray-900">{saleData?.cantidad_detalles}</span>
                                                        </div>
                                                        <div className="text-gray-500">
                                                            <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalAmount)}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }}
                                />
                                {onConfirm && (
                                    <DialogFooter className="">
                                        <Button
                                            variant="outline"
                                            onClick={() => onCloseDialog(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={onConfirm}
                                            className="gap-2"
                                        >
                                            <Check className="h-4 w-4" />
                                            Confirmar Selección
                                        </Button>
                                    </DialogFooter>
                                )}
                            </>
                        )
                    }
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SelectSalesReturnModal;