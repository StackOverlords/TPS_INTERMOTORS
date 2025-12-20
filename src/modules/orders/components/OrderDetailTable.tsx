import { Button } from '@/components/atoms/button';
import { Trash2, X } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { formatCell } from '@/utils/formatCell';
import CustomizableTable from '@/components/common/CustomizableTable';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import { EditablePrice } from '@/modules/shoppingCart/components/editablePrice';
import type { UIOrderDetailCreate } from '../types/orderCreate.types';
// import { EditablePercentage } from '@/modules/shoppingCart/components/EditablePercentage';
import type { UIOrderDetailUpdate } from '../types/orderUpdate.types';
import { Badge } from '@/components/atoms/badge';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';
import useConfirmMutation from '@/hooks/useConfirmMutation';
import ConfirmationModal from '@/components/common/confirmationModal';
import { useDeleteOrderDetail } from '../hooks/useDeleteOrderDetail';
import { formatCurrency } from '@/utils/formaters';

type OrderDetailUnion = UIOrderDetailCreate | UIOrderDetailUpdate;

interface OrderDetailTableProps<T extends OrderDetailUnion> {
    details: T[];
    onUpdateCantidad: (id_producto: number, cantidad: number) => void;
    onUpdateCosto: (id_producto: number, costo: number) => void;
    onUpdatePrecioVenta: (id_producto: number, precio: number) => void;
    onUpdateIncPVenta: (id_producto: number, inc: number) => void;
    onUpdatePrecioVentaAlt: (id_producto: number, precio: number) => void;
    onUpdateIncPVentaAlt: (id_producto: number, inc: number) => void;
    onRemoveProduct: (id_producto: number) => void;
    isLoading?: boolean;
    isReadOnly?: boolean;
    isSaving?: boolean;
    isEditMode?: boolean; // Nueva prop para saber si estamos en modo edición
}

export interface OrderDetailTableRef {
    focusFirstQuantityInput: () => void;
    focusQuantityInputByProductId: (productId: number) => void;
}

function OrderDetailTableInner<T extends OrderDetailUnion>({
    details,
    onUpdateCantidad,
    onUpdateCosto,
    onUpdatePrecioVenta,
    onUpdateIncPVenta,
    onUpdatePrecioVentaAlt,
    onUpdateIncPVentaAlt,
    onRemoveProduct,
    isLoading = false,
    isReadOnly = false,
    isSaving = false,
    isEditMode = false,
}: OrderDetailTableProps<T>, ref: React.Ref<OrderDetailTableRef>) {
    // refs para inputs de cantidad
    const firstQuantityInputRef = useRef<HTMLInputElement | null>(null);
    const quantityInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

    const handleDeleteSuccess = (_data: unknown, detailId: number) => {
        const deletedItem = details.find(d => 'id_detalle_pedido' in d && d.id_detalle_pedido === detailId);
        if (deletedItem) {
            onRemoveProduct(deletedItem.id_producto);
        }
        showSuccessToast({
            title: "Detalle de pedido eliminado",
            description: `El detalle de pedido #${detailId} se eliminó exitosamente`,
            duration: 5000
        });
    };

    const handleDeleteError = (_error: unknown, detailId: number) => {
        showErrorToast({
            title: "Error al eliminar el detalle de pedido",
            description: `No se pudo eliminar el detalle de pedido #${detailId}. Por favor, intenta nuevamente`,
            duration: 5000
        });
    };

    const {
        mutate: deleteOrderDetail,
        isPending: isDeleting
    } = useDeleteOrderDetail();

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: detailToDelete
    } = useConfirmMutation(deleteOrderDetail, handleDeleteSuccess, handleDeleteError);

    const handleRemoveItem = (item: T) => {
        // Si no estamos en modo edición, siempre eliminamos del estado local
        if (!isEditMode) {
            onRemoveProduct(item.id_producto);
            return;
        }

        // Si estamos en modo edición, verificamos si el item existe en BD
        const isNew = !('id_detalle_pedido' in item) || !item.id_detalle_pedido;

        if (isNew) {
            // Item nuevo, solo eliminamos del estado local
            onRemoveProduct(item.id_producto);
        } else {
            // Item existente en BD, mostramos confirmación y eliminamos de BD
            handleOpenDeleteAlert((item as UIOrderDetailUpdate).id_detalle_pedido ?? undefined);
        }
    };

    // Exponer métodos para enfocar inputs
    useImperativeHandle(ref, () => ({
        focusFirstQuantityInput: () => {
            if (firstQuantityInputRef.current) {
                firstQuantityInputRef.current.focus();
                firstQuantityInputRef.current.select();
            }
        },
        focusQuantityInputByProductId: (productId: number) => {
            const input = quantityInputRefs.current.get(productId);
            if (input) {
                setTimeout(() => {
                    input.focus();
                    input.select();
                }, 50);
            } else {
                // Fallback: si no encuentra el input específico, enfoca el primero
                if (firstQuantityInputRef.current) {
                    firstQuantityInputRef.current.focus();
                    firstQuantityInputRef.current.select();
                }
            }
        }
    }), []);

    const columns = useMemo<ColumnDef<T>[]>(() => {
        const baseColumns: ColumnDef<T>[] = [];

        baseColumns.push(
            {
                accessorKey: 'orden',
                id: "orden",
                header: "N°",
                size: 30,
                minSize: 20,
                enableSorting: true,
            },
        )

        // Columna de código/badge solo en modo edición
        if (isEditMode) {
            baseColumns.push({
                accessorKey: "id_detalle_pedido",
                header: "Cód.",
                size: 50,
                minSize: 30,
                cell: ({ row, getValue }) => {
                    const value = getValue<number>();
                    const isNew = !('id_detalle_pedido' in row.original) || !row.original.id_detalle_pedido;
                    return (
                        <div className="flex items-center justify-center">
                            {isNew ? (
                                <Badge
                                    variant={'accent'}
                                    className='text-[10px] px-1 py-0'
                                >
                                    Nuevo
                                </Badge>
                            ) : (
                                <span>{value}</span>
                            )}
                        </div>
                    );
                },
            });
        }

        // Resto de columnas
        baseColumns.push(
            {
                accessorKey: "id_producto",
                header: "Cód. P.",
                size: 50,
                minSize: 40,
            },
            {
                accessorFn: row => row.product.descripcion,
                id: "descripcion",
                header: "Descripción",
                size: 300,
                minSize: 250,
                enableHiding: false,
                cell: ({ getValue }) => (
                    <span>{getValue<string>()}</span>
                )
            },
            {
                accessorFn: row => row.product.codigo_oem,
                id: "codigo_oem",
                header: "Cód. OEM",
                size: 100,
                minSize: 70,
                cell: ({ getValue }) => (
                    <span>{formatCell(getValue<string>())}</span>
                ),
            },

            {
                accessorKey: "cantidad",
                id: 'cantidad',
                header: "Cantidad",
                size: 110,
                minSize: 80,
                cell: ({ getValue, row }) => {
                    const cantidad = getValue<number>();
                    const productId = row.original.id_producto;
                    const refToAssign = row.index === 0 ? firstQuantityInputRef : null;
                    return (
                        <EditableQuantity
                            value={cantidad}
                            className="w-full"
                            buttonClassName="w-full"
                            onSubmit={(value) => onUpdateCantidad(row.original.id_producto, value as number)}
                            validate={(val) => {
                                const num = parseInt(val);
                                return !isNaN(num) && num > 0;
                            }}
                            inputRef={(el) => {
                                if (refToAssign) {
                                    refToAssign.current = el;
                                }
                                if (el) {
                                    quantityInputRefs.current.set(productId, el);
                                } else {
                                    quantityInputRefs.current.delete(productId);
                                }
                            }}
                            disabled={isReadOnly || isSaving}
                        />
                    )
                },
            },
            {
                accessorKey: "costo",
                id: 'costo',
                header: "Costo",
                size: 110,
                minSize: 80,
                cell: ({ getValue, row }) => {
                    const costo = getValue<number>();
                    return (
                        <EditablePrice
                            value={costo}
                            onSubmit={(value) => onUpdateCosto(row.original.id_producto, value as number)}
                            className="w-full"
                            buttonClassName="w-full"
                            numberProps={{ min: 0, step: 0.01 }}
                            disabled={isReadOnly || isSaving}
                        />
                    )
                },
            },
            {
                accessorFn: row => row.product.codigo_upc,
                id: "codigo_upc",
                header: "Cód. UPC",
                size: 100,
                minSize: 70,
            },
            {
                accessorFn: row => row.product.marca,
                id: "marca",
                header: "Marca",
                size: 100,
                minSize: 70,
                cell: ({ getValue }) => (
                    <span>{formatCell(getValue<string>())}</span>
                ),
            },
            {
                accessorFn: row => row.product.procedencia,
                id: "procedencia",
                header: "Procedencia",
                size: 100,
                minSize: 70,
                cell: ({ getValue }) => (
                    <span>{formatCell(getValue<string>())}</span>
                ),
            },
            // {
            //     accessorKey: "inc_p_venta",
            //     id: 'inc_p_venta',
            //     header: "Inc. %",
            //     size: 110,
            //     minSize: 80,
            //     cell: ({ getValue, row }) => {
            //         const inc = getValue<number>();
            //         return (
            //             <EditablePercentage
            //                 value={inc}
            //                 onSubmit={(value) => onUpdateIncPVenta(row.original.id_producto, value as number)}
            //                 className="w-full"
            //                 buttonClassName="w-full"
            //                 disabled={isReadOnly || isSaving}
            //             />
            //         )
            //     },
            // },
            // {
            //     accessorKey: "precio_venta",
            //     id: 'precio_venta',
            //     header: "P. Venta",
            //     size: 110,
            //     minSize: 80,
            //     cell: ({ getValue, row }) => {
            //         const precio = getValue<number>();
            //         return (
            //             <EditablePrice
            //                 value={precio}
            //                 onSubmit={(value) => onUpdatePrecioVenta(row.original.id_producto, value as number)}
            //                 className="w-full"
            //                 buttonClassName="w-full"
            //                 numberProps={{ min: 0, step: 0.01 }}
            //                 disabled={isReadOnly || isSaving}
            //             />
            //         )
            //     },
            // },
            // {
            //     accessorKey: "inc_p_venta_alt",
            //     id: 'inc_p_venta_alt',
            //     header: "Inc. Alt %",
            //     size: 110,
            //     minSize: 80,
            //     cell: ({ getValue, row }) => {
            //         const inc = getValue<number>();
            //         return (
            //             <EditablePercentage
            //                 value={inc}
            //                 onSubmit={(value) => onUpdateIncPVentaAlt(row.original.id_producto, value as number)}
            //                 className="w-full"
            //                 buttonClassName="w-full"
            //                 disabled={isReadOnly || isSaving}
            //             />
            //         )
            //     },
            // },
            // {
            //     accessorKey: "precio_venta_alt",
            //     id: 'precio_venta_alt',
            //     header: "P. Venta Alt",
            //     size: 110,
            //     minSize: 80,
            //     cell: ({ getValue, row }) => {
            //         const precio = getValue<number>();
            //         return (
            //             <EditablePrice
            //                 value={precio}
            //                 onSubmit={(value) => onUpdatePrecioVentaAlt(row.original.id_producto, value as number)}
            //                 className="w-full"
            //                 buttonClassName="w-full"
            //                 numberProps={{ min: 0, step: 0.01 }}
            //                 disabled={isReadOnly || isSaving}
            //             />
            //         )
            //     },
            // },
            {
                id: 'subtotal',
                header: 'Subtotal',
                size: 110,
                minSize: 80,
                cell: ({ row }) => {
                    const detail = row.original
                    const subtotal = detail.costo * detail.cantidad
                    return (
                        <div className='font-medium text-end text-sm'>
                            {formatCurrency(subtotal)}
                        </div>
                    )
                }
            },
            {
                id: "action",
                header: "Acciones",
                size: 60,
                minSize: 40,
                cell: ({ row }) => {
                    const item = row.original;
                    const isNew = !isEditMode || !('id_detalle_pedido' in item) || !item.id_detalle_pedido;

                    return (
                        <div className='flex items-center justify-center'>
                            <Button
                                disabled={isReadOnly || isSaving || isDeleting}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveItem(item)}
                                className="w-8 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:border-red-200"
                            >
                                {isNew && isEditMode ? (
                                    <X className="size-3" />
                                ) : (
                                    <Trash2 className="size-3" />
                                )}
                            </Button>
                        </div>
                    )
                }
            }
        );

        return baseColumns;
    }, [
        isEditMode,
        onUpdateCantidad,
        onUpdateCosto,
        onUpdateIncPVenta,
        onUpdatePrecioVenta,
        onUpdateIncPVentaAlt,
        onUpdatePrecioVentaAlt,
        onRemoveProduct,
        isReadOnly,
        isSaving,
        isDeleting
    ]);

    const table = useReactTable<T>({
        data: details,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: "onChange",
        enableColumnResizing: true,
        enableRowSelection: true,
        initialState: {
            sorting: [
                {
                    id: 'orden',
                    desc: false,
                },
            ],
        },
    });

    return (
        <>
            <CustomizableTable
                table={table}
                isLoading={isLoading}
            />

            <ConfirmationModal
                isOpen={showDeleteAlert}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                title="Eliminar detalle de pedido"
                message={`¿Estás seguro de eliminar el detalle de pedido #${detailToDelete}?`}
                isLoading={isDeleting}
            />
        </>
    );
}

// Exportar con forwardRef tipado correctamente
const OrderDetailTable = forwardRef(OrderDetailTableInner) as React.ForwardRefExoticComponent<
    OrderDetailTableProps<OrderDetailUnion> & React.RefAttributes<OrderDetailTableRef>
>;

OrderDetailTable.displayName = 'OrderDetailTable';

export default OrderDetailTable;