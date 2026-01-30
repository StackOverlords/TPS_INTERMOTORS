import { Button } from '@/components/atoms/button';
import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { Trash2 } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { formatCell } from '@/utils/formatCell';
import CustomizableTable from '@/components/common/CustomizableTable';
import { useCartWithUtils } from '@/modules/shoppingCart/hooks/useCartWithUtils';
import { EditableQuantity } from '@/modules/shoppingCart/components/editableQuantity';
import { EditablePrice } from '@/modules/shoppingCart/components/editablePrice';
import type { CartItem } from '@/modules/shoppingCart/types/cart.types';
import { Input } from '@/components/atoms/input';
import { useCustomTable } from '@/hooks/useCustomTable';

interface ProductDetailTableProps {
    isReadOnly?: boolean
    details?: CartItem[] | null;
}

export interface ProductDetailTableRef {
    focusFirstQuantityInput: () => void;
    focusQuantityInputByProductId: (productId: number) => void;
}

function ProductDetailTableInner({
    isReadOnly = false,
    details
}: ProductDetailTableProps, ref: React.Ref<ProductDetailTableRef>) {

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
        updateCustomDescription,
        updateCustomBrand,
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
            size: 100,
            minSize: 70,
            cell: ({ getValue }) => (
                <div>{formatCell(getValue<string>())}</div>
            ),
        },
        {
            accessorKey: "customDescription",
            id: "descripcion",
            header: "Descripción",
            size: 300,
            minSize: 250,
            enableHiding: false,
            cell: ({ row, getValue }) => {
                const refToAssign = row.index === 0 ? firstQuantityInputRef : null;
                const customDescription = getValue<string>()
                return (
                    <div className="flex items-center">
                        <Input
                            value={customDescription}
                            onChange={(e) => !isReadOnly && updateCustomDescription(row.original.product.id, e.target.value)}
                            ref={refToAssign}
                            autoSelectOnFocus={true}
                            disabled={isReadOnly}
                        />
                    </div>
                )
            },
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
                        inputClassName="hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        numberProps={{ min: 0, step: 0.01 }}
                        disabled={isReadOnly}
                    />
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
                        onChange={(e) => !isReadOnly && updateCustomBrand(row.original.product.id, e.target.value)}
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
                            className="w-8 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent hover:border-destructive/30"
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
        updateCustomBrand,
        updateCustomDescription,
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
        persistenceKey: `quotation-items-create-${user?.name}`,
        sharedPersistenceKey: `quotation-items-shared-${user?.name}`,
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
const ProductDetailTable = forwardRef(ProductDetailTableInner) as React.ForwardRefExoticComponent<
    ProductDetailTableProps & React.RefAttributes<ProductDetailTableRef>
>;

ProductDetailTable.displayName = 'ProductDetailTable';

export default ProductDetailTable;