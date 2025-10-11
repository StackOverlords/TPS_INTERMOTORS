import { Button } from '@/components/atoms/button';
import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { Trash2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { formatCell } from '@/utils/formatCell';
import CustomizableTable from '@/components/common/CustomizableTable';
import { useCartWithUtils } from '@/modules/shoppingCart/hooks/useCartWithUtils';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import { EditablePrice } from '@/modules/shoppingCart/components/editablePrice';
import type { CartItem } from '@/modules/shoppingCart/types/cart.types';
import { Input } from '@/components/atoms/input';

const ProductDetailTable = forwardRef((_, ref) => {
    const user = authSDK.getCurrentUser()
    const { selectedBranchId } = useBranchStore()
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
        updateCustomDescription,
        updateCustomBrand,
        updateQuantity,
        removeItem,
        updateCustomPrice,
        updateCustomSubtotal,
    } = useCartWithUtils(user?.name || '', selectedBranchId ?? '')

    const columns = useMemo<ColumnDef<CartItem>[]>(() => [
        {
            accessorFn: row => row.product.codigo_oem,
            id: "codigo_oem",
            header: "Cód. OEM",
            size: 100,
            minSize: 70,
            cell: ({ getValue }) => (
                <div>{formatCell(getValue<string>())}</div>
            ),
        },
        {
            accessorKey: "customDescription",
            id: "descripcion",
            header: "Descripcion",
            size: 300,
            minSize: 250,
            enableHiding: false,
            cell: ({ row, getValue }) => {
                const refToAssign = row.index === 0 ? firstQuantityInputRef : null;
                const customDescription = getValue<string>()
                return (
                    <div
                        className="flex items-center">
                        <Input
                            value={customDescription}
                            onChange={(e) => updateCustomDescription(row.original.product.id, e.target.value)}
                            ref={refToAssign}
                            autoSelectOnFocus={true}
                        />
                    </div>
                )
            },
        },
        {
            accessorKey: "customBrand",
            id: "marca",
            header: "Marca",
            cell: ({ row, getValue }) => {
                const customBrand = getValue<string>()
                return (
                    <Input
                        value={customBrand}
                        onChange={(e) => updateCustomBrand(row.original.product.id, e.target.value)}
                        autoSelectOnFocus={true}
                    />
                )
            },
        },
        {
            accessorKey: "quantity",
            id: 'cantidad',
            header: "Cantidad",
            minSize: 110,
            cell: ({ getValue, row }) => {
                const quantity = getValue<number>()
                const product = row.original.product
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
        removeItem,
        updateCustomBrand,
        updateCustomDescription,
        updateCustomPrice,
        updateCustomSubtotal,
        updateQuantity
    ])
    const table = useReactTable<CartItem>({
        data: cart,
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
export default ProductDetailTable