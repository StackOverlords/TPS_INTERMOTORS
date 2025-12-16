import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { CreditCard } from 'lucide-react';
import { useCartWithUtils } from '../hooks/useCartWithUtils';
import { Label } from '@/components/atoms/label';
import { EditablePercentage } from './EditablePercentage';
import { EditablePrice } from './editablePrice';
import { useNavigate } from 'react-router';
import TableShoppingCart, { type TableShoppingCartRef } from './tableShoppingCart';
import ShortcutKey from '@/components/common/ShortcutKey';
import { useHotkeys } from 'react-hotkeys-hook';
import { formatCurrency } from '@/utils/formaters';
import { Badge } from '@/components/atoms/badge';
import { CartActionBar } from './CartActionBar';

interface ShoppingCartProps {
    callback?: () => void;
    tableRef: React.RefObject<TableShoppingCartRef | null>
}

const BottomShoppingCartBar: React.FC<ShoppingCartProps> = ({
    callback,
    tableRef,
}) => {
    const user = authSDK.getCurrentUser()
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
    const navigate = useNavigate()
    const {
        items: cart,
        getCartSubtotal,
        getCartTotal,
        discountAmount,
        discountPercent,
        setDiscountAmount,
        setDiscountPercent,
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
            <footer className='p-2 flex flex-col gap-2 flex-shrink-0'>
                {
                    cart.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                            <div className="space-y-1">
                                <Label className="text-xs">Desc. Porcentaje (%)</Label>
                                <EditablePercentage
                                    key={discountPercent}
                                    value={discountPercent}
                                    onSubmit={(value) => setDiscountPercent(value as number)}
                                    className="w-full"
                                    buttonClassName="w-full"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Desc. Monto (Bs)</Label>
                                <EditablePrice
                                    key={discountAmount}
                                    value={discountAmount}
                                    onSubmit={(value) => setDiscountAmount(value as number)}
                                    className="w-full"
                                    buttonClassName="w-full"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Subtotal</Label>
                                <Badge
                                    variant={'secondary'}
                                    className="w-full h-8 rounded-sm text-sm font-normal"
                                >
                                    {formatCurrency(subtotal)}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Total</Label>
                                <Badge
                                    variant={'success'}
                                    className="w-full h-8 rounded-sm text-sm font-bold"
                                >
                                    {formatCurrency(total)}
                                </Badge>
                            </div>
                        </div>
                    )
                }

                <CartActionBar
                    showhClearBottom={true}
                    onAction={(path) => {
                        navigate(path)
                    }}
                />
            </footer>
        </section>
    );
};
export default BottomShoppingCartBar