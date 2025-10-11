import { Button } from '@/components/atoms/button';
import { Trash2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { formatCell } from '@/utils/formatCell';
import CustomizableTable from '@/components/common/CustomizableTable';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import { EditablePrice } from '@/modules/shoppingCart/components/editablePrice';
import type { SaleUpdateDetailUI } from '../../types/saleUpdate.type';

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
                const product = row.original.producto
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
        <CustomizableTable
            table={table}
            isLoading={false}
        />
    );
});
export default SaleDetailsEditingTable