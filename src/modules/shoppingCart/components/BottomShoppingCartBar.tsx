import { Button } from '@/components/atoms/button';
import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { FileText, CreditCard, BrushCleaning } from 'lucide-react';
import { useCartWithUtils } from '../hooks/useCartWithUtils';
import { Label } from '@/components/atoms/label';
import { EditablePercentage } from './EditablePercentage';
import { EditablePrice } from './editablePrice';
import { useNavigate } from 'react-router';
import TableShoppingCart from './tableShoppingCart';
import ShortcutKey from '@/components/common/ShortcutKey';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRef } from 'react';
import { formatCurrency } from '@/utils/formaters';

interface ShoppingCartProps {
    callback?: () => void;
}

const BottomShoppingCartBar: React.FC<ShoppingCartProps> = ({
    callback
}) => {
    const tableRef = useRef<{ focusFirstQuantityInput: () => void }>(null);
    const user = authSDK.getCurrentUser()
    const { selectedBranchId } = useBranchStore()
    const navigate = useNavigate()
    const {
        items: cart,
        getCartSubtotal,
        getCartTotal,
        discountAmount,
        discountPercent,
        setDiscountAmount,
        setDiscountPercent,
        clearCart,
    } = useCartWithUtils(user?.name || '', selectedBranchId ?? '')

    const subtotal = getCartSubtotal();
    const total = getCartTotal();

    // shorcuts
    useHotkeys("alt+f", () => {
        if (tableRef.current) {
            callback?.()
            tableRef.current.focusFirstQuantityInput();
        }
    }, {
        enableOnFormTags: false,
        preventDefault: true,
    })

    return (
        <section
            className="bg-card border border-border rounded-lg shadow-sm overflow-hidden h-full flex flex-col"
        >
            <header className="bg-primary text-primary-foreground p-2 flex-shrink-0">
                <h3 className="font-semibold text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Carrito de Venta
                    </div>

                    <ShortcutKey combo='alt+f' variant="dark" />
                </h3>
            </header>

            <div className='flex-1 min-h-0'>
                <div className="overflow-auto h-full px-0.5">
                    {cart.length === 0 ? (
                        <article className="p-8 h-full flex flex-col justify-center items-center text-muted-foreground">
                            <div className="text-lg font-medium">Carrito vacío</div>
                            <div className="text-sm mt-1">Agrega productos para comenzar</div>
                        </article>
                    ) : (
                        <TableShoppingCart ref={tableRef} />
                    )}
                </div>
            </div>
            {
                cart.length > 0 && (
                    <footer className='p-2 flex flex-col gap-0.5 flex-shrink-0'>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">

                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Desc. Porcentaje (%)</Label>
                                <EditablePercentage
                                    key={discountPercent}
                                    value={discountPercent}
                                    onSubmit={(value) => setDiscountPercent(value as number)}
                                    className="w-full"
                                    buttonClassName="w-full"
                                    showEditIcon={false}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Desc. Monto ($)</Label>
                                <EditablePrice
                                    key={discountAmount}
                                    value={discountAmount}
                                    onSubmit={(value) => setDiscountAmount(value as number)}
                                    className="w-full"
                                    buttonClassName="w-full"
                                    showEditIcon={false}
                                />
                            </div>

                            <div className="flex gap-2 text-xs lg:text-lg font-medium items-end h-full justify-end">
                                <span className="text-gray-500 font-medium">Subtotal:</span>
                                <span className="">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex gap-2 font-medium text-xs lg:text-lg h-full items-end justify-end">
                                <span>Total:</span>
                                <span className='text-emerald-600 font-bold'>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                className="cursor-pointer"
                                onClick={() => {
                                    navigate('/dashboard/create-sale')
                                }}>
                                <CreditCard className="size-4" />
                                Proceder a la Venta
                            </Button>
                            <Button
                                onClick={() => {
                                    navigate('/dashboard/create-quotation')
                                }}
                                variant="outline"
                                className="cursor-pointer">
                                <FileText className="size-4" />
                                Proceder a la Cotización
                            </Button>

                            {
                                cart.length > 0 && (
                                    <Button
                                        className="cursor-pointer"
                                        size={'sm'}
                                        onClick={clearCart}
                                        variant={'destructive'}
                                    >
                                        <BrushCleaning />
                                        Limpiar
                                    </Button>
                                )
                            }
                        </div>
                    </footer>
                )
            }
        </section>
    );
};
export default BottomShoppingCartBar