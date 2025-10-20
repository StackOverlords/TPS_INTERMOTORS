import { Button } from '@/components/atoms/button';
import { Trash2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { formatCell } from '@/utils/formatCell';
import CustomizableTable from '@/components/common/CustomizableTable';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import { EditablePrice } from '@/modules/shoppingCart/components/editablePrice';
import type { UIReturnDetailCreate } from '../types/returnCreate.types';
import type { UIReturnDetailUpdate } from '../types/returnUpdate.types';
import { Input } from '@/components/atoms/input';

type ReturnDetailUnion = UIReturnDetailCreate | UIReturnDetailUpdate;

interface ReturnDetailTableProps<T extends ReturnDetailUnion> {
    details: T[];
    onUpdateCantidad: (id_detalle: number, cantidad: number) => void;
    onUpdatePrecio: (id_detalle: number, costo: number) => void;
    onUpdateComentario: (id_detalle: number, comentario: string) => void;
    onRemoveProduct: (id_detalle: number) => void;
    isLoading?: boolean;
}

export interface ReturnDetailTableRef {
    focusFirstQuantityInput: () => void;
}

function ReturnDetailTableInner<T extends ReturnDetailUnion>({
    details,
    onUpdateCantidad,
    onUpdatePrecio,
    onUpdateComentario,
    onRemoveProduct,
    isLoading = false
}: ReturnDetailTableProps<T>, ref: React.Ref<ReturnDetailTableRef>) {
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
            accessorKey: "almacen_out_det_id",
            header: "Detalle ID",
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
                        onSubmit={(value) => onUpdateCantidad(row.original.almacen_out_det_id, value as number)}
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
            header: "Precio",
            size: 110,
            minSize: 80,
            cell: ({ getValue, row }) => {
                const precio = getValue<number>();
                return (
                    <EditablePrice
                        value={precio}
                        onSubmit={(value) => onUpdatePrecio(row.original.almacen_out_det_id, value as number)}
                        className="w-full"
                        buttonClassName="w-full"
                        numberProps={{ min: 0, step: 0.01 }}
                    />
                )
            },
        },
        {
            accessorFn: row => row.comentario,
            id: 'comentario',
            header: "Comentario",
            size: 110,
            minSize: 80,
            cell: ({ getValue, row }) => {
                const comentario = getValue<string>()
                return (
                    <Input
                        type='text'
                        value={comentario ?? ''}
                        placeholder='Comentario sobre la devolución'
                        onChange={(value) => onUpdateComentario(row.original.almacen_out_det_id, value.target.value)}
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
                            onClick={() => onRemoveProduct(row.original.almacen_out_det_id)}
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
        onUpdatePrecio,
        onUpdateComentario,
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
const ReturnDetailTable = forwardRef(ReturnDetailTableInner) as React.FC<
    ReturnDetailTableProps<ReturnDetailUnion> & { ref?: React.Ref<ReturnDetailTableRef> }
>;

ReturnDetailTable.displayName = 'ReturnDetailTable';

export default ReturnDetailTable;