import { Button } from '@/components/atoms/button';
import { Trash2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { formatCell } from '@/utils/formatCell';
import CustomizableTable from '@/components/common/CustomizableTable';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import { EditablePrice } from '@/modules/shoppingCart/components/editablePrice';
import type { UIOrderDetailCreate } from '../types/orderCreate.types';
import { EditablePercentage } from '@/modules/shoppingCart/components/EditablePercentage';
import type { UIOrderDetailUpdate } from '../types/orderUpdate.types';

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
}

export interface OrderDetailTableRef {
    focusFirstQuantityInput: () => void;
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
    isLoading = false
}: OrderDetailTableProps<T>, ref: React.Ref<OrderDetailTableRef>) {
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

    const columns = useMemo<ColumnDef<T>[]>(() => [
        {
            accessorKey: "id_producto",
            header: "ID",
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
                        inputRef={refToAssign}
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
                    />
                )
            },
        },
        {
            accessorKey: "inc_p_venta",
            id: 'inc_p_venta',
            header: "Inc. %",
            size: 110,
            minSize: 80,
            cell: ({ getValue, row }) => {
                const inc = getValue<number>();
                return (
                    <EditablePercentage
                        value={inc}
                        onSubmit={(value) => onUpdateIncPVenta(row.original.id_producto, value as number)}
                        className="w-full"
                        buttonClassName="w-full"
                    />
                )
            },
        },
        {
            accessorKey: "precio_venta",
            id: 'precio_venta',
            header: "P. Venta",
            size: 110,
            minSize: 80,
            cell: ({ getValue, row }) => {
                const precio = getValue<number>();
                return (
                    <EditablePrice
                        value={precio}
                        onSubmit={(value) => onUpdatePrecioVenta(row.original.id_producto, value as number)}
                        className="w-full"
                        buttonClassName="w-full"
                        numberProps={{ min: 0, step: 0.01 }}
                    />
                )
            },
        },
        {
            accessorKey: "inc_p_venta_alt",
            id: 'inc_p_venta_alt',
            header: "Inc. Alt %",
            size: 110,
            minSize: 80,
            cell: ({ getValue, row }) => {
                const inc = getValue<number>();
                return (
                    <EditablePercentage
                        value={inc}
                        onSubmit={(value) => onUpdateIncPVentaAlt(row.original.id_producto, value as number)}
                        className="w-full"
                        buttonClassName="w-full"
                    />
                )
            },
        },
        {
            accessorKey: "precio_venta_alt",
            id: 'precio_venta_alt',
            header: "P. Venta Alt",
            size: 110,
            minSize: 80,
            cell: ({ getValue, row }) => {
                const precio = getValue<number>();
                return (
                    <EditablePrice
                        value={precio}
                        onSubmit={(value) => onUpdatePrecioVentaAlt(row.original.id_producto, value as number)}
                        className="w-full"
                        buttonClassName="w-full"
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
                return (
                    <div className='flex items-center justify-center'>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onRemoveProduct(row.original.id_producto)}
                            className="w-8 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:border-red-200"
                        >
                            <Trash2 className="size-3" />
                        </Button>
                    </div>
                )
            }
        }
    ], [
        onUpdateCantidad,
        onUpdateCosto,
        onUpdateIncPVenta,
        onUpdatePrecioVenta,
        onUpdateIncPVentaAlt,
        onUpdatePrecioVentaAlt,
        onRemoveProduct
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
    });

    return (
        <CustomizableTable
            table={table}
            isLoading={isLoading}
        />
    );
}

// Exportar con forwardRef tipado correctamente
const OrderDetailTable = forwardRef(OrderDetailTableInner) as React.FC<
    OrderDetailTableProps<OrderDetailUnion> & { ref?: React.Ref<OrderDetailTableRef> }
>;

OrderDetailTable.displayName = 'OrderDetailTable';

export default OrderDetailTable;