import { Button } from "@/components/atoms/button"
import { Label } from "@/components/atoms/label"
import { Switch } from "@/components/atoms/switch"
import { BrushCleaning, CreditCard, FileText } from "lucide-react"
import { useNavigate } from "react-router"
import { cn } from "@/lib/utils"
import type { CartMode } from "../types/cart.types"
import authSDK from "@/services/sdk-simple-auth"
import { useBranchStore } from "@/states/branchStore"
import { useCartWithUtils } from "../hooks/useCartWithUtils"
import CartModeConversionModal from "./CartModeConversionModal"
import { useCallback, useState } from "react"

const modeConfig = {
    "sale-strict": {
        icon: CreditCard,
        label: "Proceder a la Venta",
        path: "/dashboard/create-sale",
    },
    "sale-permissive": {
        icon: CreditCard,
        label: "Proceder a la Venta",
        path: "/dashboard/create-sale",
    },
    "quote": {
        icon: FileText,
        label: "Proceder a la Cotización",
        path: "/dashboard/create-quotation",
    },
} as const

interface CartActionBarProps {
    onAction?: (path: string) => void
    className?: string
    showhClearBottom?: boolean
}

export const CartActionBar = ({
    onAction,
    className,
    showhClearBottom = false
}: CartActionBarProps) => {
    const DEFAULT_SALE_MODE: CartMode = 'sale-strict' as CartMode;

    const [showModeConversionModal, setShowModeConversionModal] = useState(false);
    const [targetModeForModal, setTargetModeForModal] = useState<CartMode>('sale-strict');

    const user = authSDK.getCurrentUser()
    const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
    const navigate = useNavigate()
    const {
        items: cart,
        clearCart,
        mode,
        setCartMode,
        previewConversion,
    } = useCartWithUtils(user?.name || '', selectedBranchId ?? '')

    const config = modeConfig[mode] ?? modeConfig[DEFAULT_SALE_MODE]
    const { icon: Icon, label, path } = config

    const handleManualModeChange = useCallback((newMode: CartMode) => {
        if (mode === newMode) return;

        if (newMode === 'sale-strict' && cart.length > 0) {
            const preview = previewConversion('sale-strict');

            if (preview.willHaveChanges) {
                setTargetModeForModal('sale-strict');
                setShowModeConversionModal(true);
            } else {
                setCartMode('sale-strict');
            }
        } else {
            setCartMode(newMode);
        }
    }, [mode, cart.length, previewConversion, setCartMode]);

    const handleCloseModal = useCallback(() => {
        setShowModeConversionModal(false);
    }, []);


    return (
        <div className={cn("flex justify-between items-center gap-2", className)}>

            <div className="flex gap-2">
                {(mode === "sale-strict" || mode === 'sale-permissive') && (
                    <>
                        <Button
                            onClick={() => handleManualModeChange('sale-strict')}
                            variant={mode === 'sale-strict' ? 'default' : 'secondary'}
                        >
                            Estricta
                        </Button>
                        <Button
                            onClick={() => handleManualModeChange('sale-permissive')}
                            variant={mode === 'sale-permissive' ? 'default' : 'secondary'}
                        >
                            Permisiva
                        </Button>
                    </>
                )}
                <div className="flex items-center gap-2 h-8 px-2 rounded-sm border-border border">
                    <Switch
                        id="cart-mode-switch"
                        checked={mode === "quote"}
                        onCheckedChange={(checked) =>
                            handleManualModeChange(checked ? 'quote' : DEFAULT_SALE_MODE)
                        }
                    />
                    <Label htmlFor="cart-mode-switch">
                        Cotización
                    </Label>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    className="cursor-pointer"
                    onClick={() => {
                        if (onAction) return onAction(path)
                        navigate(path)
                    }}
                >
                    <Icon className="size-4" />
                    {label}
                </Button>
                {
                    cart.length > 0 && showhClearBottom && (
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

            <CartModeConversionModal
                open={showModeConversionModal}
                onClose={handleCloseModal}
                targetMode={targetModeForModal}
            />
        </div>
    )
}