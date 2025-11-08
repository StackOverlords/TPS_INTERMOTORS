import { Button } from '@/components/atoms/button';
import { Trash2, X } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import CustomizableTable from '@/components/common/CustomizableTable';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import { EditablePrice } from '@/modules/shoppingCart/components/editablePrice';
import { Input } from '@/components/atoms/input';
import type { QuotationUpdateDetail } from '../types/quotationUpdate.types';
import { Badge } from '@/components/atoms/badge';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';
import { useDeleteQuotationDetail } from '../hooks/useDeleteQuotationDetail';
import useConfirmMutation from '@/hooks/useConfirmMutation';
import ConfirmationModal from '@/components/common/confirmationModal';

type QuotationDetailsEditingTableProps = {
    products: QuotationUpdateDetail[]
    removeItem: (id: number) => void
    updateQuantity: (productId: number, quantity: number) => void
    updatePrice: (productId: number, price: number) => void
    updateCustomSubtotal: (productId: number, customSubtotal: number) => void
    updateDescription: (productId: number, description: string) => void;
    updateBrand: (productId: number, brand: string) => void;
};

export const QuotationDetailsEditingTable = forwardRef<
    { focusFirstQuantityInput: () => void },
    QuotationDetailsEditingTableProps
>(({
    products,
    removeItem,
    updateQuantity,
    updatePrice,
    updateCustomSubtotal,
    updateBrand,
    updateDescription,
}, ref) => {
    // refs para inputs de cantidad
    const firstQuantityInputRef = useRef<HTMLInputElement | null>(null);

    const handleDeleteSuccess = (_data: unknown, detailId: number) => {
        const deletedItem = products.find(p => p.id_detalle_cotizacion === detailId);

        if (deletedItem) {
            removeItem(deletedItem.id_producto);
        }

        showSuccessToast({
            title: "Detalle de cotización eliminado",
            description: `El detalle de cotizacion #${detailId} se eliminó exitosamente`,
            duration: 5000
        })

    };

    const handleDeleteError = (_error: unknown, detailId: number) => {
        showErrorToast({
            title: "Error al eliminar el detalle de cotización",
            description: `No se pudo eliminar el detalle de cotización #${detailId}. Por favor, intenta nuevamente`,
            duration: 5000
        })
    };

    const {
        mutate: deleteQuotationDetail,
        isPending: isDeleting
    } = useDeleteQuotationDetail()

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: detailToDelete
    } = useConfirmMutation(deleteQuotationDetail, handleDeleteSuccess, handleDeleteError)

    const handleRemoveItem = (item: QuotationUpdateDetail) => {
        const isNew = !item.id_detalle_cotizacion
        if (isNew) {
            removeItem(item.id_producto)
            return
        }

        handleOpenDeleteAlert(item.id_detalle_cotizacion ?? undefined)
    }

    // Exponer método focusFirstQuantityInput
    useImperativeHandle(ref, () => ({
        focusFirstQuantityInput: () => {
            if (firstQuantityInputRef.current) {
                firstQuantityInputRef.current.focus();
            }
        }
    }));

    const columns = useMemo<ColumnDef<QuotationUpdateDetail>[]>(() => [
        {
            accessorKey: "orden",
            header: "#",
            size: 25,
        },
        {
            accessorKey: "id_detalle_cotizacion",
            header: "Cód.",
            size: 40,
            cell({ row, getValue }) {
                const value = getValue<number>()
                const isNew = !row.original.id_detalle_cotizacion
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
            accessorKey: "descripcion",
            id: "descripcion",
            header: "Descripcion",
            size: 300,
            minSize: 250,
            enableHiding: false,
            cell: ({ row, getValue }) => {
                const refToAssign = row.index === 0 ? firstQuantityInputRef : null;
                const description = getValue<string>()
                const item = row.original
                return (
                    <div
                        className="flex items-center">
                        <Input
                            value={description}
                            onChange={(e) => updateDescription(item.id_producto, e.target.value)}
                            ref={refToAssign}
                            autoSelectOnFocus={true}
                        />
                    </div>
                )
            },
        },
        {
            accessorKey: "nueva_marca",
            id: "marca",
            header: "Marca",
            cell: ({ row, getValue }) => {
                const brand = getValue<string>()
                const item = row.original
                return (
                    <Input
                        value={brand}
                        onChange={(e) => updateBrand(item.id_producto, e.target.value)}
                        autoSelectOnFocus={true}
                    />
                )
            },
        },
        {
            accessorKey: "cantidad",
            header: "Cantidad",
            minSize: 110,
            cell: ({ getValue, row }) => {
                const quantity = getValue<number>()
                const item = row.original
                return (
                    <EditableQuantity
                        value={quantity}
                        className="w-full"
                        buttonClassName="w-full"
                        onSubmit={(value) => updateQuantity(item.id_producto, value as number)}
                        validate={(val) => {
                            const num = parseInt(val);
                            return !isNaN(num) && num > 0;
                        }}
                    />
                )
            },
        },
        {
            accessorKey: "precio",
            header: "Precio Unit.",
            minSize: 110,
            cell: ({ getValue, row }) => {
                const basePrice = getValue<number>()
                const item = row.original
                return (
                    <EditablePrice
                        value={basePrice}
                        onSubmit={(value) => updatePrice(item.id_producto, value as number)}
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
                const item = row.original
                const subtotal = item.cantidad * item.precio
                return (
                    <EditablePrice
                        value={subtotal}
                        onSubmit={(value) => updateCustomSubtotal(item.id_producto, value as number)}
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
                const isNew = !row.original.id_detalle_cotizacion
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
    ], [removeItem, updateQuantity, updatePrice, updateCustomSubtotal, updateBrand, updateDescription]);
    const table = useReactTable<QuotationUpdateDetail>({
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
                title="Eliminar producto de cotización"
                message={`¿Estás seguro de que deseas eliminar el detalle de cotización #${detailToDelete}?`}
                onClose={handleCloseDeleteAlert}
                onConfirm={handleConfirmDeleteAlert}
                isLoading={isDeleting}
            />
        </>
    );
});
export default QuotationDetailsEditingTable