import { Button } from '@/components/atoms/button';
import { Trash2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { formatCell } from '@/utils/formatCell';
import CustomizableTable from '@/components/common/CustomizableTable';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import type { UITransferDetailCreate } from '../types/transferCreate.types';
import { formatCurrency } from '@/utils/formaters';

interface TransferDetailTableProps {
    details: UITransferDetailCreate[];
    onUpdateCantidad: (producto_id: number, purchase_id: number, cantidad: number) => void;
    onRemoveProduct: (producto_id: number, purchase_id: number) => void;
    isLoading?: boolean;
}

export interface TransferDetailTableRef {
    focusFirstQuantityInput: () => void;
}

function TransferDetailTableInner({
    details,
    onUpdateCantidad,
    onRemoveProduct,
    isLoading = false
}: TransferDetailTableProps, ref: React.Ref<TransferDetailTableRef>) {
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

    const columns = useMemo<ColumnDef<UITransferDetailCreate>[]>(() => [
        {
            accessorKey: "producto_id",
            header: "ID Producto",
            size: 80,
            minSize: 60,
        },
        {
            accessorFn: row => row.product.descripcion,
            id: "descripcion",
            header: "Descripción",
            size: 300,
            minSize: 250,
            enableHiding: false,
            cell: ({ getValue }) => (
                <span className="font-medium">{getValue<string>()}</span>
            )
        },
        {
            accessorFn: row => row.product.codigo_oem,
            id: "codigo_oem",
            header: "Cód. OEM",
            size: 120,
            minSize: 90,
            cell: ({ getValue }) => (
                <span className="font-mono text-xs">{formatCell(getValue<string>())}</span>
            ),
        },
        {
            accessorFn: row => row.product.codigo_upc,
            id: "codigo_upc",
            header: "Cód. UPC",
            size: 120,
            minSize: 90,
            cell: ({ getValue }) => (
                <span className="font-mono text-xs">{formatCell(getValue<string>())}</span>
            ),
        },
        {
            accessorKey: "cantidad_entrada_salida",
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
                        onSubmit={(value) => onUpdateCantidad(row.original.producto_id, row.original.purchase_id, value as number)}
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
            accessorKey: "costo_entrada",
            id: 'costo',
            header: "Costo Entrada",
            size: 120,
            minSize: 90,
            cell: ({ getValue }) => {
                const costo = getValue<number>();
                return (
                    <div className="text-right font-medium text-blue-600">
                        {formatCurrency(costo)}
                    </div>
                )
            },
        },
        {
            accessorKey: "precio_salida",
            id: 'precio_salida',
            header: "Precio Salida",
            size: 120,
            minSize: 90,
            cell: ({ getValue }) => {
                const precio = getValue<number>();
                return (
                    <div className="text-right font-medium">
                        {formatCurrency(precio)}
                    </div>
                )
            },
        },
        {
            accessorKey: "precio_entrada_venta",
            id: 'precio_entrada_venta',
            header: "Precio Venta",
            size: 120,
            minSize: 90,
            cell: ({ getValue }) => {
                const precio = getValue<number>();
                return (
                    <div className="text-right font-medium text-green-600">
                        {formatCurrency(precio)}
                    </div>
                )
            },
        },
        {
            accessorKey: "precio_entrada_venta_alt",
            id: 'precio_entrada_venta_alt',
            header: "Precio Venta Alt",
            size: 130,
            minSize: 100,
            cell: ({ getValue }) => {
                const precio = getValue<number>();
                return (
                    <div className="text-right font-medium text-green-600">
                        {formatCurrency(precio)}
                    </div>
                )
            },
        },
        {
            accessorKey: "incremento_p_entrada_venta",
            id: 'incremento_venta',
            header: "Inc. Venta %",
            size: 110,
            minSize: 80,
            cell: ({ getValue }) => {
                const incremento = getValue<number>();
                return (
                    <div className="text-center text-xs">
                        {incremento.toFixed(2)}%
                    </div>
                )
            },
        },
        {
            accessorKey: "incremento_p_entrada_venta_alt",
            id: 'incremento_venta_alt',
            header: "Inc. Venta Alt %",
            size: 130,
            minSize: 100,
            cell: ({ getValue }) => {
                const incremento = getValue<number>();
                return (
                    <div className="text-center text-xs">
                        {incremento.toFixed(2)}%
                    </div>
                )
            },
        },
        {
            id: "subtotal",
            header: "Subtotal",
            size: 120,
            minSize: 90,
            cell: ({ row }) => {
                const subtotal = row.original.cantidad_entrada_salida * row.original.costo_entrada;
                return (
                    <div className="text-right font-bold text-emerald-600">
                        {formatCurrency(subtotal)}
                    </div>
                )
            }
        },
        {
            id: "action",
            header: "Acciones",
            size: 80,
            minSize: 60,
            cell: ({ row }) => {
                return (
                    <div className='flex items-center justify-center'>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onRemoveProduct(row.original.producto_id, row.original.purchase_id)}
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
        onRemoveProduct
    ]);

    const table = useReactTable<UITransferDetailCreate>({
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
const TransferDetailTable = forwardRef(TransferDetailTableInner) as React.FC<
    TransferDetailTableProps & { ref?: React.Ref<TransferDetailTableRef> }
>;

TransferDetailTable.displayName = 'TransferDetailTable';

export default TransferDetailTable;
