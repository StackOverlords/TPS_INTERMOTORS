import { Button } from '@/components/atoms/button';
import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { Trash2 } from 'lucide-react';
import { useCartWithUtils } from '../hooks/useCartWithUtils';
import { EditablePrice } from './editablePrice';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import type { CartItem } from '../types/cart.types';
import { formatCell } from '@/utils/formatCell';
import { EditableQuantity } from './editableQuantity';
import CustomizableTable from '@/components/common/CustomizableTable';
import { useCustomTable } from '@/hooks/useCustomTable';

interface TableShoppingCartProps {
    isReadOnly?: boolean
    details?: CartItem[] | null;
}

export interface TableShoppingCartRef {
    focusFirstQuantityInput: () => void;
    focusQuantityInputByProductId: (productId: number) => void;
}

function TableShoppingCartInner({
    isReadOnly = false,
    details
}: TableShoppingCartProps, ref: React.Ref<TableShoppingCartRef>) {

    const user = authSDK.getCurrentUser()
    const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
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
            id: "orden",
            header: "N°",
            size: 30,
            minSize: 20,
            cell: ({ row }) => (
                <span className="text-center block">
                    {row.index + 1}
                </span>
            ),
        },
        {
            accessorFn: row => row.product.id,
            id: "codigo_interno",
            header: "Cód Int.",
            size: 45,
            minSize: 30,
            enableHiding: false,
            cell: ({ getValue }) => (
                <span className="text-center text-xs text-muted-foreground">{getValue<number>()}</span>
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
            accessorFn: row => row.product.descripcion,
            id: "descripcion",
            header: "Descripción",
            size: 300,
            minSize: 250,
            enableHiding: false,
            cell: ({ getValue }) => (
                <div
                    className="flex items-center">
                    <h3 className="font-medium text-foreground truncate">{getValue<string>()}</h3>
                </div>
            ),
        },
        {
            accessorKey: "quantity",
            id: 'cantidad',
            header: "Cantidad",
            minSize: 110,
            cell: ({ getValue, row }) => {
                const cantidad = getValue<number>();
                const productId = row.original.product.id;
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
            accessorKey: "customPrice",
            id: 'precio',
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
                        inputClassName="hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                        numberProps={{ min: 0, step: 0.01 }}
                        disabled={isReadOnly}
                    />
                )
            },
        },
        {
            accessorFn: row => row.product.marca,
            id: "marca",
            header: "Marca",
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
                            className="w-8 cursor-pointer text-destructive hover:text-destructive/80 hover:bg-destructive/10 bg-transparent hover:border-destructive/30"
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

    const {
        table,
    } = useCustomTable({
        data: dataToUse,
        columns,

        // Configuración de características
        enableSorting: true,
        enableColumnResizing: true,
        enableColumnOrdering: true,

        // Configuración de resize
        columnResizeMode: "onChange",
        defaultSortBy: [
            { id: 'orden', desc: false }
        ],

        // Persistencia con key única por usuario
        persistenceKey: `shopping-cart-table-products-${user?.name}`,
        sharedPersistenceKey: `shopping-cart-table-products-shared-${user?.name}`,
        persistColumnVisibility: true,
        persistColumnOrder: true,
    });

    return (
        <CustomizableTable
            table={table}
            isLoading={false}
            noDataMessage="No hay productos en el carrito."
            errorMessage="Ocurrió un error al cargar los productos"
            enableColumnReordering={true}
        />
    );
}

// Exportar con forwardRef tipado correctamente
const TableShoppingCart = forwardRef(TableShoppingCartInner) as React.ForwardRefExoticComponent<
    TableShoppingCartProps & React.RefAttributes<TableShoppingCartRef>
>;

TableShoppingCart.displayName = 'TableShoppingCart';

export default TableShoppingCart;