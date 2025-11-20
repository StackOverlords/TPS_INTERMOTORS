import { Button } from '@/components/atoms/button';
import { Trash2, X } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { formatCell } from '@/utils/formatCell';
import CustomizableTable from '@/components/common/CustomizableTable';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import { EditablePrice } from '@/modules/shoppingCart/components/editablePrice';
import type { SaleUpdateDetailUI } from '../../types/saleUpdate.type';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';
import useConfirmMutation from '@/hooks/useConfirmMutation';
import { Badge } from '@/components/atoms/badge';
import ConfirmationModal from '@/components/common/confirmationModal';
import { useDeleteSaleDetail } from '../../hooks/useDeleteSaleDetail';

type SaleDetailsEditingTableProps = {
    products: SaleUpdateDetailUI[]
    removeItem: (id: number) => void
    updateQuantity: (productId: number, quantity: number) => void
    updatePrice: (productId: number, price: number) => void
    updateCustomSubtotal: (productId: number, customSubtotal: number) => void
};

export const SaleDetailsEditingTable = forwardRef<
    { focusFirstQuantityInput: () => void }, // tipo del ref
    SaleDetailsEditingTableProps                     // tipo de props
>(({
    products,
    removeItem,
    updateQuantity,
    updatePrice,
    updateCustomSubtotal
}, ref) => {
    // refs para inputs de cantidad
    const firstQuantityInputRef = useRef<HTMLInputElement | null>(null);

    const handleDeleteSuccess = (_data: unknown, detailId: number) => {
        const deletedItem = products.find(p => p.id_detalle_venta === detailId);

        if (deletedItem) {
            removeItem(deletedItem.id_producto);
        }

        showSuccessToast({
            title: "Detalle de venta eliminado",
            description: `El detalle de venta #${detailId} se eliminó exitosamente`,
            duration: 5000
        })

    };

    const handleDeleteError = (_error: unknown, detailId: number) => {
        showErrorToast({
            title: "Error al eliminar el detalle de venta",
            description: `No se pudo eliminar el detalle de venta #${detailId}. Por favor, intenta nuevamente`,
            duration: 5000
        })
    };

    const {
        mutate: deleteSaleDetail,
        isPending: isDeleting
    } = useDeleteSaleDetail()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: detailToDelete
    } = useConfirmMutation(deleteSaleDetail, handleDeleteSuccess, handleDeleteError)

    const handleRemoveItem = (item: SaleUpdateDetailUI) => {
        const isNew = !item.id_detalle_venta
        if (isNew) {
            removeItem(item.id_producto)
            return
        }

        handleOpenDeleteAlert(item.id_detalle_venta ?? undefined)
    }

    // Exponer método focusFirstQuantityInput
    useImperativeHandle(ref, () => ({
        focusFirstQuantityInput: () => {
            if (firstQuantityInputRef.current) {
                firstQuantityInputRef.current.focus();
            }
        }
    }));

    const columns = useMemo<ColumnDef<SaleUpdateDetailUI>[]>(() => [
        {
            accessorKey: "id_detalle_venta",
            header: "Cód.",
            size: 40,
            cell({ row, getValue }) {
                const value = getValue<number>()
                const isNew = !row.original.id_detalle_venta
                return (
                    <div className='flex items-center'>
                        {
                            isNew ? (
                                <Badge
                                    variant={'accent'}
                                    className='text-[10px] px-1 py-0'
                                >
                                    Nuevo
                                </Badge>
                            ) : (
                                <span>{value}</span>
                            )
                        }
                    </div>
                )
            },
        },
        {
            accessorFn: row => row.producto.descripcion,
            id: "descripcion",
            header: "Descripcion",
            size: 300,
            minSize: 250,
            enableHiding: false,
            cell: ({ getValue }) => (
                <div
                    className="flex items-center">
                    <h3 className="font-medium text-gray-700 truncate">{getValue<string>()}</h3>
                </div>
            ),
        },
        {
            accessorFn: row => row.producto.codigo_oem,
            id: "codigo_oem",
            header: "Cód. OEM",
            cell: ({ getValue }) => (
                <div>{formatCell(getValue<string>())}</div>
            ),
        },
        {
            accessorFn: row => row.producto.marca,
            id: "marca",
            header: "Marca",
            cell: ({ getValue }) => {
                const marca = getValue<string>()
                return (
                    <span>{marca}</span>
                )
            }
        },
        {
            accessorKey: "cantidad",
            id: 'cantidad',
            header: "Cantidad",
            minSize: 110,
            cell: ({ getValue, row }) => {
                const quantity = getValue<number>()
                const product = row.original.producto
                // Solo asignar el ref al primer row (rowIndex === 0)
                const refToAssign = row.index === 0 ? firstQuantityInputRef : null;
                return (
                    <EditableQuantity
                        value={quantity}
                        className="w-full"
                        buttonClassName="w-full"
                        onSubmit={(value) => updateQuantity(product.id, value as number)}
                        validate={(val) => {
                            const num = parseInt(val);
                            return !isNaN(num) && num > 0;
                        }}
                        inputRef={refToAssign}
                    />
                )
            },
        },
        {
            accessorKey: "precio",
            id: 'precio',
            header: "Precio Unit.",
            minSize: 110,
            cell: ({ getValue, row }) => {
                const basePrice = getValue<number>()
                const product = row.original.producto
                return (
                    <EditablePrice
                        value={basePrice}
                        onSubmit={(value) => updatePrice(product.id, value as number)}
                        className="w-full"
                        buttonClassName="w-full"
                        numberProps={{ min: 0, step: 0.01 }}
                    />
                )
            },
        },
        {
            id: 'customSubtotal',
            header: "Subtotal",
            minSize: 110,
            cell: ({ row }) => {
                const product = row.original.producto
                const item = row.original
                const subtotal = item.cantidad * item.precio
                return (
                    <EditablePrice
                        value={subtotal}
                        onSubmit={(value) => updateCustomSubtotal(product.id, value as number)}
                        className="w-full"
                        inputClassName="hover:bg-green-50 text-green-600 hover:text-green-600 border-green-200"
                        numberProps={{ min: 0, step: 0.01 }}
                    />
                )
            },
        },
        {
            id: "action",
            header: "Acciones",
            size: 60,
            minSize: 40,
            cell: ({ row }) => {
                const item = row.original
                const isNew = !row.original.id_detalle_venta
                return (
                    <div className='flex items-center justify-center'>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => isNew ? removeItem(item.id_producto) : handleRemoveItem(item)}
                            className="text-red-500 hover:text-red-500 size-7 cursor-pointer"
                        >
                            {
                                isNew ? (
                                    <X className="size-3" />
                                ) : (
                                    <Trash2 className="size-3" />
                                )
                            }
                        </Button>
                    </div>
                )
            }
        }
    ], [removeItem, updateQuantity, updatePrice, updateCustomSubtotal]);
    const table = useReactTable<SaleUpdateDetailUI>({
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
        <>
            <CustomizableTable
                table={table}
                isLoading={false}
            />

            <ConfirmationModal
                isOpen={showDeleteAlert}
                title="Eliminar producto de venta"
                message={`¿Estás seguro de que deseas eliminar el detalle de venta #${detailToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </>
    );
});
export default SaleDetailsEditingTable