import { Button } from '@/components/atoms/button';
import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { Trash2 } from 'lucide-react';
import { useCartWithUtils } from '../hooks/useCartWithUtils';
import { EditablePrice } from './editablePrice';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import type { CartItem } from '../types/cart.types';
import { formatCell } from '@/utils/formatCell';
import { EditableQuantity } from './editableQuantity';
import CustomizableTable from '@/components/common/CustomizableTable';

interface TableShoppingCartProps {
    isReadOnly?: boolean
    details?: CartItem[] | null;
}

const TableShoppingCart = forwardRef(({
    isReadOnly = false,
    details
}: TableShoppingCartProps, ref) => {
    const user = authSDK.getCurrentUser()
    const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
    // refs para inputs de cantidad
    const firstQuantityInputRef = useRef<HTMLInputElement | null>(null);

    // Exponer método focusFirstQuantityInput
    useImperativeHandle(ref, () => ({
        focusFirstQuantityInput: () => {
            if (firstQuantityInputRef.current) {
                firstQuantityInputRef.current.focus();
            }
        }
    }));
    const {
        items: cart,
        updateQuantity,
        removeItem,
        updateCustomPrice,
        updateCustomSubtotal,
    } = useCartWithUtils(user?.name || '', selectedBranchId ?? '')

    const dataToUse = useMemo(() => {
        if (isReadOnly && details && details.length > 0) {
            return details;
        }
        return cart;
    }, [isReadOnly, details, cart]);

    const columns = useMemo<ColumnDef<CartItem>[]>(() => [
        {
            accessorFn: row => row.product.descripcion,
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
            accessorFn: row => row.product.codigo_oem,
            id: "codigo_oem",
            header: "Cód. OEM",
            cell: ({ getValue }) => (
                <div>{formatCell(getValue<string>())}</div>
            ),
        },
        {
            accessorFn: row => row.product.marca,
            id: "marca",
            header: "Marca",
        },
        {
            accessorKey: "quantity",
            id: 'cantidad',
            header: "Cantidad",
            minSize: 110,
            cell: ({ getValue, row }) => {
                const quantity = getValue<number>()
                const product = row.original.product
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
                        disabled={isReadOnly}
                    />
                )
            },
        },
        {
            accessorKey: "customPrice",
            id: 'customPrice',
            header: "Precio Unit.",
            minSize: 110,
            cell: ({ getValue, row }) => {
                const basePrice = getValue<number>()
                const product = row.original.product
                return (
                    <EditablePrice
                        value={basePrice}
                        onSubmit={(value) => updateCustomPrice(product.id, value as number)}
                        className="w-full"
                        buttonClassName="w-full"
                        numberProps={{ min: 0, step: 0.01 }}
                        disabled={isReadOnly}
                    />
                )
            },
        },
        {
            accessorKey: "customSubtotal",
            id: 'customSubtotal',
            header: "Subtotal",
            minSize: 110,
            cell: ({ getValue, row }) => {
                const itemSubtotal = getValue<number>()
                const product = row.original.product
                return (
                    <EditablePrice
                        value={itemSubtotal}
                        onSubmit={(value) => updateCustomSubtotal(product.id, value as number)}
                        className="w-full"
                        inputClassName="hover:bg-green-50 text-green-600 hover:text-green-600 border-green-200"
                        numberProps={{ min: 0, step: 0.01 }}
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
                const product = row.original.product
                if (isReadOnly) {
                    return null;
                }

                return (
                    <div className='flex items-center justify-center'>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(product.id)}
                            className="w-8 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:border-red-200"
                        >
                            <Trash2 className="size-3" />
                        </Button>
                    </div>
                )
            }
        }
    ], [
        isReadOnly,
        removeItem,
        updateCustomPrice,
        updateCustomSubtotal,
        updateQuantity
    ])
    const table = useReactTable<CartItem>({
        data: dataToUse,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: "onChange",
        enableColumnResizing: true,
        enableRowSelection: true,
    })

    return (
        <CustomizableTable
            table={table}
            isLoading={false}
        />
    );
});
export default TableShoppingCart