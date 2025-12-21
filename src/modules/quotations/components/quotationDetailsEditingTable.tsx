import { Button } from '@/components/atoms/button';
import { Trash2, X } from 'lucide-react';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import CustomizableTable from '@/components/common/CustomizableTable';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import { EditablePrice } from '@/modules/shoppingCart/components/editablePrice';
import { Input } from '@/components/atoms/input';
import { Badge } from '@/components/atoms/badge';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';
import { useDeleteQuotationDetail } from '../hooks/useDeleteQuotationDetail';
import useConfirmMutation from '@/hooks/useConfirmMutation';
import ConfirmationModal from '@/components/common/confirmationModal';
import type { QuotationUpdateDetailUI } from '../hooks/useQuotationProductDetails';
import { formatCell } from '@/utils/formatCell';

type QuotationDetailsEditingTableProps = {
    products: QuotationUpdateDetailUI[]
    removeItem: (id: number) => void
    updateQuantity: (productId: number, quantity: number) => void
    updatePrice: (productId: number, price: number) => void
    updateCustomSubtotal: (productId: number, customSubtotal: number) => void
    updateDescription: (productId: number, description: string) => void;
    updateBrand: (productId: number, brand: string) => void;
    isReadOnly?: boolean
};

export interface QuotationDetailsEditingTableRef {
    focusFirstQuantityInput: () => void;
    focusQuantityInputByProductId: (productId: number) => void;
}

function QuotationDetailsEditingTableInner({
    products,
    removeItem,
    updateQuantity,
    updatePrice,
    updateCustomSubtotal,
    updateBrand,
    updateDescription,
    isReadOnly = false,
}: QuotationDetailsEditingTableProps, ref: React.Ref<QuotationDetailsEditingTableRef>) {
    // refs para inputs de cantidad
    const firstQuantityInputRef = useRef<HTMLInputElement | null>(null);
    const quantityInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

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

    const handleRemoveItem = useCallback((item: QuotationUpdateDetailUI) => {
        const isNew = !item.id_detalle_cotizacion
        if (isNew) {
            removeItem(item.id_producto)
            return
        }

        handleOpenDeleteAlert(item.id_detalle_cotizacion ?? undefined)
    }, [removeItem, handleOpenDeleteAlert])

    const columns = useMemo<ColumnDef<QuotationUpdateDetailUI>[]>(() => [
        {
            accessorKey: 'orden',
            id: "orden",
            header: "N°",
            size: 30,
            minSize: 20,
            enableSorting: true,
        },
        {
            accessorKey: "id_detalle_cotizacion",
            id: "id_detalle_cotizacion",
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
            accessorKey: 'id_producto',
            id: "id_producto",
            header: "Cód Int.",
            size: 45,
            minSize: 20,
        },
        {
            accessorKey: 'codigo_oem',
            id: "codigo_oem",
            header: "Cód. OEM",
            size: 100,
            minSize: 70,
            cell: ({ getValue }) => (
                <div>{formatCell(getValue<string>())}</div>
            ),
        },
        {
            accessorKey: "descripcion",
            id: "descripcion",
            header: "Descripción",
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
                            type='text'
                            value={description ?? ''}
                            onChange={(e) => updateDescription(item.id_producto, e.target.value)}
                            ref={refToAssign}
                            autoSelectOnFocus={true}
                            disabled={isReadOnly}
                        />
                    </div>
                )
            },
        },
        {
            accessorKey: "cantidad",
            id: 'cantidad',
            header: "Cantidad",
            minSize: 110,
            cell: ({ getValue, row }) => {
                const cantidad = getValue<number>();
                const productId = row.original.id_producto
                const refToAssign = row.index === 0 ? firstQuantityInputRef : null;
                return (
                    <EditableQuantity
                        value={cantidad}
                        className="w-full"
                        buttonClassName="w-full"
                        onSubmit={(value) => updateQuantity(productId, value as number)}
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
                        disabled={isReadOnly}
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
                        disabled={isReadOnly}
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
                        disabled={isReadOnly}
                    />
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
                        type='text'
                        value={brand ?? ''}
                        onChange={(e) => updateBrand(item.id_producto, e.target.value)}
                        autoSelectOnFocus={true}
                        disabled={isReadOnly}
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
                            disabled={isReadOnly}
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
    const table = useReactTable<QuotationUpdateDetailUI>({
        data: products,
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
            columnVisibility: {
                'id_detalle_cotizacion': false
            }
        },
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
}

// Exportar con forwardRef tipado correctamente
const QuotationDetailsEditingTable = forwardRef(QuotationDetailsEditingTableInner) as React.ForwardRefExoticComponent<
    QuotationDetailsEditingTableProps & React.RefAttributes<QuotationDetailsEditingTableRef>
>;

QuotationDetailsEditingTable.displayName = 'QuotationDetailsEditingTable';

export default QuotationDetailsEditingTable;