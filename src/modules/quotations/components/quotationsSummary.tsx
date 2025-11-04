import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { Loader2, Save } from "lucide-react";
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice";
import { EditablePercentage } from "@/modules/shoppingCart/components/EditablePercentage";
import TooltipButton from "@/components/common/TooltipButton";
import ShortcutKey from "@/components/common/ShortcutKey";
import { formatCurrency } from "@/utils/formaters";
import { Badge } from "@/components/atoms/badge";
interface SalesSummaryProps {
    isReadOnly?: boolean
    isPending: boolean
    clearCart: () => void
    setDiscountPercent: (percent: number) => void
    setDiscountAmount: (amount: number) => void
    handleNewQuotation: () => void
    discountPercent: number
    discountAmount: number
    subtotal: number
    total: number
    hasProducts?: boolean
}
const QuotationsSummary: React.FC<SalesSummaryProps> = ({
    isReadOnly = false,
    isPending,
    clearCart,
    setDiscountPercent,
    setDiscountAmount,
    handleNewQuotation,
    discountPercent,
    discountAmount,
    subtotal,
    total,
    hasProducts = false
}) => {

    const newQuotation = () => {
        clearCart();
        handleNewQuotation();
    }

    return (
        <Card className="border border-border shadow-none md:flex-shrink-0">
            <CardContent className="space-y-2 p-2 sm:p-3">

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                    <div className="space-y-1">
                        <Label className="text-xs">Desc. Porcentaje (%)</Label>
                        <EditablePercentage
                            key={discountPercent}
                            value={discountPercent}
                            onSubmit={(value) => setDiscountPercent(value as number)}
                            className="w-full"
                            buttonClassName="w-full"
                            disabled={isReadOnly}
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
                            disabled={isReadOnly}
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

                <footer className="flex gap-2 items-center justify-between flex-wrap">
                    <div className="flex gap-1">
                        {[0, 5, 10, 15, 20].map((percentage) => (
                            <Button
                                key={percentage}
                                type="button"
                                variant="outline"
                                className="text-xs h-7 px-2 border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-600 transition-colors duration-300"
                                onClick={() => setDiscountPercent(percentage)}
                                disabled={isReadOnly}
                            >
                                {percentage}%
                            </Button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 w-full md:w-auto md:flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full py-3 font-medium"
                            onClick={newQuotation}
                        >
                            Nueva Cotización
                        </Button>

                        {/* Botón de submit */}
                        <TooltipButton
                            buttonProps={{
                                type: 'submit',
                                disabled: isPending || !hasProducts || isReadOnly,
                                variant: 'default',
                                className: "w-full"
                            }}
                            tooltip={
                                <span className="flex items-center gap-1">Registrar Cotización <ShortcutKey combo="alt+s" /></span>
                            }
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Procesando Cotización...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 size-4" />
                                    Registrar Cotización
                                </>
                            )}
                            {/* <Kbd variant="dark" className="ml-2 ">Alt + S</Kbd> */}
                        </TooltipButton>
                    </div>
                </footer>
            </CardContent>
        </Card>
    );
}

export default QuotationsSummary;