// components/returnDetailTable.tsx
import { Button } from '@/components/atoms/button';
import { Trash2, X } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { formatCell } from '@/utils/formatCell';
import CustomizableTable from '@/components/common/CustomizableTable';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import type { UIReturnDetailCreate } from '../types/returnCreate.types';
import type { UIReturnDetailUpdate } from '../types/returnUpdate.types';
import { Input } from '@/components/atoms/input';
import { formatCurrency } from '@/utils/formaters';
import { Badge } from '@/components/atoms/badge';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';
import useConfirmMutation from '@/hooks/useConfirmMutation';
import ConfirmationModal from '@/components/common/confirmationModal';
import { useDeleteReturnDetail } from '../hooks/useDeleteReturnDetail';

type ReturnDetailUnion = UIReturnDetailCreate | UIReturnDetailUpdate;

interface ReturnDetailTableProps<T extends ReturnDetailUnion> {
    details: T[];
    onUpdateCantidad: (id_detalle: number, cantidad: number) => void;
    onUpdatePrecio: (id_detalle: number, precio: number) => void;
    onUpdateComentario: (id_detalle: number, comentario: string) => void;
    onRemoveProduct: (id_detalle: number) => void;
    isLoading?: boolean;
    isReadOnly?: boolean;
    isSaving?: boolean;
    isEditMode?: boolean;
}

export interface ReturnDetailTableRef {
    focusFirstQuantityInput: () => void;
    focusQuantityInputByProductId: (almacenOutDetId: number) => void;
}

function ReturnDetailTableInner<T extends ReturnDetailUnion>({
    details,
    onUpdateCantidad,
    onUpdatePrecio,
    onUpdateComentario,
    onRemoveProduct,
    isLoading = false,
    isReadOnly = false,
    isSaving = false,
    isEditMode = false,
}: ReturnDetailTableProps<T>, ref: React.Ref<ReturnDetailTableRef>) {
    // refs para inputs de cantidad
    const firstQuantityInputRef = useRef<HTMLInputElement | null>(null);
    const quantityInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

    const handleDeleteSuccess = (_data: unknown, detailId: number) => {
        const deletedItem = details.find(d => 'id' in d && d.id === detailId);
        if (deletedItem) {
            onRemoveProduct(deletedItem.almacen_out_det_id);
        }
        showSuccessToast({
            title: "Detalle de devolución eliminado",
            description: `El detalle se eliminó exitosamente`,
            duration: 5000
        });
    };

    const handleDeleteError = (_error: unknown, detailId: number) => {
        showErrorToast({
            title: "Error al eliminar",
            description: `No se pudo eliminar el detalle #${detailId}`,
            duration: 5000
        });
    };

    const {
        mutate: deleteReturnDetail,
        isPending: isDeleting
    } = useDeleteReturnDetail();

    const {
        close: handleCloseDeleteAlert,
        confirm: handleConfirmDeleteAlert,
        isOpen: showDeleteAlert,
        open: handleOpenDeleteAlert,
        variables: detailToDelete
    } = useConfirmMutation(deleteReturnDetail, handleDeleteSuccess, handleDeleteError);

    const handleRemoveItem = (item: T) => {
        // Si no estamos en modo edición, siempre eliminamos del estado local
        if (!isEditMode) {
            onRemoveProduct(item.almacen_out_det_id);
            return;
        }

        // Si estamos en modo edición, verificamos si el item existe en BD
        const isNew = !('almacen_out_dev_det_id' in item) || !item.almacen_out_dev_det_id;

        if (isNew) {
            // Item nuevo, solo eliminamos del estado local
            onRemoveProduct(item.almacen_out_det_id);
        } else {
            // Item existente en BD, mostramos confirmación y eliminamos de BD
            handleOpenDeleteAlert((item as UIReturnDetailUpdate).almacen_out_dev_det_id ?? undefined);
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
        focusQuantityInputByProductId: (almacenOutDetId: number) => {
            const input = quantityInputRefs.current.get(almacenOutDetId);
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
                accessorKey: "almacen_out_dev_det_id",
                header: "Cód.",
                size: 50,
                minSize: 30,
                cell: ({ row, getValue }) => {
                    const value = getValue<number>();
                    const isNew = !('almacen_out_dev_det_id' in row.original) || !row.original.almacen_out_dev_det_id;
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

        baseColumns.push(
            {
                accessorKey: 'almacen_out_id',
                id: "almacen_out_id",
                header: "Cód Ven.",
                size: 50,
                minSize: 20,
            },
        )

        baseColumns.push(
            {
                accessorKey: "almacen_out_det_id",
                header: "Cód Det.",
                size: 50,
                minSize: 30,
            },
            {
                accessorFn: row => row.product.descripcion,
                id: "descripcion",
                header: "Descripción",
                size: 250,
                minSize: 200,
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
                accessorKey: "precio",
                id: 'precio',
                header: "Precio",
                size: 110,
                minSize: 80,
                cell: ({ getValue }) => {
                    const precio = getValue<number>();
                    return (
                        <div className="font-medium text-green-600">
                            {formatCurrency(precio)}
                        </div>
                    )
                },
            },
            {
                accessorKey: "cantidad",
                id: 'cantidad',
                header: "Cantidad",
                size: 110,
                minSize: 80,
                cell: ({ getValue, row }) => {
                    const cantidad = getValue<number>();
                    const almacenOutDetId = row.original.almacen_out_det_id;
                    const maxQuantity = row.original.maxQuantity;
                    const refToAssign = row.index === 0 ? firstQuantityInputRef : null;

                    return (
                        <div className="flex items-center justify-center gap-1">
                            <EditableQuantity
                                value={cantidad}
                                className="w-full"
                                buttonClassName="w-full"
                                onSubmit={(value) => {
                                    const newValue = value as number;
                                    onUpdateCantidad(almacenOutDetId, newValue);
                                }}
                                validate={(val) => {
                                    const num = parseInt(val);
                                    if (isNaN(num) || num <= 0) return false;
                                    return true;
                                }}
                                inputRef={(el) => {
                                    if (refToAssign) {
                                        refToAssign.current = el;
                                    }
                                    if (el) {
                                        quantityInputRefs.current.set(almacenOutDetId, el);
                                    } else {
                                        quantityInputRefs.current.delete(almacenOutDetId);
                                    }
                                }}
                                disabled={isReadOnly || isSaving}
                            />
                            {maxQuantity && maxQuantity !== Infinity && (
                                <div className="text-[10px] text-gray-500 text-center">
                                    Máx: {maxQuantity}
                                </div>
                            )}
                        </div>
                    )
                },
            },
            {
                accessorFn: row => row.comentario,
                id: 'comentario',
                header: "Comentario",
                size: 150,
                minSize: 80,
                cell: ({ getValue, row }) => {
                    const comentario = getValue<string>()
                    return (
                        <Input
                            type='text'
                            value={comentario ?? ''}
                            placeholder='Comentario sobre la devolución'
                            onChange={(value) => onUpdateComentario(row.original.almacen_out_det_id, value.target.value)}
                            disabled={isReadOnly || isSaving}
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
                    const item = row.original;
                    const isNew = !isEditMode || !('almacen_out_dev_det_id' in item) || !item.almacen_out_dev_det_id;

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
        onUpdatePrecio,
        onUpdateComentario,
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
            columnVisibility:{
                "almacen_out_dev_det_id":false,
                "almacen_out_id":false,
                "almacen_out_det_id":false,
            }
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
                title="Eliminar detalle de devolución"
                message={`¿Estás seguro de eliminar el detalle #${detailToDelete}?`}
                isLoading={isDeleting}
            />
        </>
    );
}

// Exportar con forwardRef tipado correctamente
const ReturnDetailTable = forwardRef(ReturnDetailTableInner) as React.ForwardRefExoticComponent<
    ReturnDetailTableProps<ReturnDetailUnion> & React.RefAttributes<ReturnDetailTableRef>
>;

ReturnDetailTable.displayName = 'ReturnDetailTable';

export default ReturnDetailTable;