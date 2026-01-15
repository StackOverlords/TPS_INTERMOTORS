import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/atoms/dialog";
import { Input } from "@/components/atoms/input";
import { Skeleton } from "@/components/atoms/skeleton";
import { TableCell, TableRow } from "@/components/atoms/table";
import CustomizableTable from "@/components/common/CustomizableTable";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { useCustomTable } from "@/hooks/useCustomTable";
import { usePurchaseById } from "@/modules/purchases/hooks/usePurchaseById";
import type { DetalleCompra } from "@/modules/purchases/schemas/purchase.schema";
import { formatCurrency, formatDate } from "@/utils/formaters";
import { type ColumnDef } from "@tanstack/react-table";
import { Calculator, CalendarDays, Check, Plus, Search, User } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface SelectPurchaseTransferModalProps {
    purchaseId: number | null;
    isDialogOpen: boolean;
    onCloseDialog: (open: boolean) => void;
    selectedProducts: { producto_id: number; cantidad_entrada_salida: number; purchase_id: number }[];
    onProductSelect: (product: DetalleCompra, purchaseId: number) => void;
}

const SelectPurchaseTransferModal: React.FC<SelectPurchaseTransferModalProps> = ({
    purchaseId,
    isDialogOpen,
    onCloseDialog,
    selectedProducts,
    onProductSelect
}) => {
    const [searchPurchaseDetail, setSearchPurchaseDetail] = useState<string>("");

    const {
        data: purchaseData,
        isLoading: isLoadingPurchase,
        isError: isErrorPurchase
    } = usePurchaseById(Number(purchaseId));

    const filteredPurchaseDetailData = useMemo(() => {
        return purchaseData?.detalles?.filter((item:any) =>
            item.producto.descripcion.toLowerCase().includes(searchPurchaseDetail.toLowerCase())
        );
    }, [purchaseData, searchPurchaseDetail]);

    // Calcular el total de la compra
    const totalAmount = useMemo(() => {
        if (!filteredPurchaseDetailData) return 0;
        return filteredPurchaseDetailData.reduce((sum, item) => {
            const cantidad = Number.parseFloat(item.cantidad);
            const costo = Number.parseFloat(item.costo);
            return sum + (cantidad * costo);
        }, 0);
    }, [filteredPurchaseDetailData]);

    // Verificar si un producto ya está seleccionado
    const isProductSelected = useCallback(
        (productoId: number, purchId: number) => {
            const item = selectedProducts.find(
                p => (p.producto_id === productoId && p.purchase_id === purchId)
            );

            return {
                isSelected: !!item,
                item,
            };
        },
        [selectedProducts]
    );

    const columns = useMemo<ColumnDef<DetalleCompra>[]>(() => [
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
                const product = row.original.producto;
                const descripcion = getValue<string>();
                return (
                    <div className="space-y-0.5">
                        <h3 title="Descripción" className="text-xs font-medium text-primary leading-tight truncate">
                            {descripcion}
                        </h3>

                        <div className="flex flex-wrap gap-1 mt-1">
                            {product.categoria && (
                                <Badge variant="accent" title="División" className="text-[10px] border-gray-300">{product.categoria.categoria}</Badge>
                            )}
                            {product.marca && (
                                <Badge variant="outline" title="Marca" className="text-[10px] border-gray-300">{product.marca.marca}</Badge>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorFn: row => row.producto.codigo_oem,
            id: "codigo_oem",
            header: "Código OEM",
            size: 120,
            minSize: 90,
            cell: ({ getValue }) => (
                <div className="font-mono text-xs">{getValue<string>() || "N/A"}</div>
            ),
        },
        {
            accessorKey: "cantidad",
            header: "Cantidad",
            size: 90,
            minSize: 80,
            cell: ({ row, getValue }) => {
                const product = row.original.producto;
                const cantidad = Number.parseFloat(getValue<string>());
                return (
                    <div className="text-center">
                        <div className="text-sm font-medium">{cantidad.toFixed(0)}</div>
                        {product.unidad_medida && (
                            <div className="text-[10px] text-gray-500">{product.unidad_medida.unidad_medida}</div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "costo",
            header: "Costo",
            size: 80,
            minSize: 70,
            cell: ({ getValue }) => {
                const costo = Number.parseFloat(getValue<string>());
                return (
                    <div className="font-medium flex items-center justify-end text-blue-600">
                        {formatCurrency(costo)}
                    </div>
                );
            },
        },
        {
            accessorKey: "precio_venta",
            header: "Precio Venta",
            size: 100,
            minSize: 80,
            cell: ({ getValue }) => {
                const precio = Number.parseFloat(getValue<string>());
                return (
                    <div className="font-medium flex items-center justify-end text-green-600">
                        {formatCurrency(precio)}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Acciones",
            size: 120,
            minSize: 100,
            cell: ({ row }) => {
                const { isSelected, item } = isProductSelected(row.original.producto.id, Number(purchaseId));

                return (
                    <div className="flex items-center justify-center gap-2">
                        {isSelected ? (
                            <div className="flex items-center gap-1 text-emerald-600">
                                <Check className="size-4" />
                                <span className="text-xs">Agregado ({item?.cantidad_entrada_salida})</span>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                variant="default"
                                className="text-xs h-7"
                                onClick={() => onProductSelect(row.original, Number(purchaseId))}
                            >
                                <Plus className="size-3" />
                                Agregar
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ], [isProductSelected, onProductSelect, purchaseId]);

    const {
        table,
    } = useCustomTable({
        data: filteredPurchaseDetailData || [],
        columns,
        enableSorting: true,
        enableColumnResizing: true,
        enableRowSelection: false,
        enableColumnVisibility: true,
        enableColumnOrdering: false,
        enablePagination: false,
        columnResizeMode: "onChange",
    });

    return (
        <Dialog open={isDialogOpen} onOpenChange={onCloseDialog}>
            <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 ">
                    <DialogTitle className="text-xl font-semibold">Detalles de la Compra</DialogTitle>
                    <DialogDescription>
                        Selecciona los productos de la compra para agregar a la transferencia
                    </DialogDescription>
                </DialogHeader>

                {/* Información de la compra */}
                {isLoadingPurchase ? (
                    <div className="px-6 py-4 space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                    </div>
                ) : isErrorPurchase ? (
                    <div className="px-6 py-4">
                        {/* <ErrorDataComponent
                            errorMessage="No se pudo obtener la información de la compra"
                        /> */}
                    </div>
                ) : purchaseData && (
                    <div className="px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                    <Calculator className="size-3" />
                                    Número de Compra
                                </p>
                                <p className="font-semibold">{purchaseData.nro}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                    <CalendarDays className="size-3" />
                                    Fecha
                                </p>
                                <p className="font-medium">{formatDate(purchaseData.fecha)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                    <User className="size-3" />
                                    Proveedor
                                </p>
                                <p className="font-medium">{purchaseData.proveedor?.proveedor || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-500 text-xs">Total Productos</p>
                                <p className="font-semibold text-blue-600">{purchaseData.cantidad_detalles}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buscador */}
                <div className="px-6 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Buscar producto por descripción..."
                            value={searchPurchaseDetail}
                            onChange={(e) => setSearchPurchaseDetail(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Tabla de productos */}
                <div className="flex-1 overflow-auto px-6">
                    {isLoadingPurchase ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-2">
                                    <Skeleton className="h-12 flex-1" />
                                </div>
                            ))}
                        </div>
                    ) : isErrorPurchase ? (
                        <ErrorDataComponent
                            errorMessage="No se pudieron cargar los productos de la compra"
                        />
                    ) : (
                        <CustomizableTable
                            table={table}
                            isLoading={isLoadingPurchase}
                            isError={isErrorPurchase}
                            rows={10}
                            errorMessage="Error al cargar los productos"
                            noDataMessage="No se encontraron productos en esta compra"
                            renderBottomRow={() => {
                                const colSpan = table.getVisibleFlatColumns().length;
                                return (
                                    <TableRow className="bg-gray-50 border-t-2">
                                        <TableCell colSpan={colSpan} className="p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-600">
                                                    Total de productos: <span className="font-semibold text-gray-900">{filteredPurchaseDetailData?.length || 0}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 mb-1">Total de la compra</div>
                                                    <div className="text-lg font-bold text-emerald-600">
                                                        {formatCurrency(totalAmount)}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }}
                        />
                    )}
                </div>

                {/* Footer */}
                {/* <div className="px-6 py-3 border-t bg-white flex justify-end items-center">
                    <Button variant="outline" onClick={() => onCloseDialog(false)}>
                        Cerrar
                    </Button>
                </div> */}
            </DialogContent>
        </Dialog>
    );
};

export default SelectPurchaseTransferModal;
