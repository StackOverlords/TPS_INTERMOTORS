import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { Edit, Loader2, Save } from "lucide-react";
import { EditablePrice } from "@/modules/shoppingCart/components/editablePrice";
import { EditablePercentage } from "@/modules/shoppingCart/components/EditablePercentage";
import TooltipButton from "@/components/common/TooltipButton";
import ShortcutKey from "@/components/common/ShortcutKey";
import { formatCurrency } from "@/utils/formaters";
import { Badge } from "@/components/atoms/badge";

type DiscountType = "amount" | "percentage";
interface SalesSummaryProps {
  isReadOnly?: boolean;
  isEditMode?: boolean;
  isPending: boolean;
  clearCart?: () => void;
  setDiscountPercent?: (percent: number) => void;
  setDiscountAmount?: (amount: number) => void;
  aplyGlobalDiscount?: (discount: number, type: DiscountType) => void;
  callback: () => void;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  total: number;
  hasProducts?: boolean;
  secondaryButtonText?: string;
}
const SalesSummary: React.FC<SalesSummaryProps> = ({
  isReadOnly = false,
  isEditMode = false,
  isPending,
  clearCart,
  setDiscountPercent,
  setDiscountAmount,
  aplyGlobalDiscount,
  callback,
  discountPercent,
  discountAmount,
  subtotal,
  total,
  hasProducts = false,
  secondaryButtonText,
}) => {
  const handleSecondaryAction = () => {
    clearCart?.();
    callback();
  };

  // Determinar textos según el modo
  const submitButtonText = isEditMode ? "Actualizar Venta" : "Registrar Venta";
  const submitButtonPendingText = isEditMode
    ? "Actualizando Venta..."
    : "Procesando Venta...";
  const finalSecondaryButtonText =
    secondaryButtonText || (isEditMode ? "Nueva Venta" : "Nueva Venta");
  const tooltipText = isEditMode ? "Actualizar Venta" : "Registrar Venta";

  return (
    <Card className="border border-border shadow-none md:flex-shrink-0">
      <CardContent className="space-y-2 p-2 sm:p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
          <div className="space-y-1">
            <Label className="text-xs">Desc. Porcentaje (%)</Label>
            <EditablePercentage
              key={discountPercent}
              value={discountPercent}
              onSubmit={(value) =>
                isEditMode
                  ? aplyGlobalDiscount?.(value as number, "percentage")
                  : setDiscountPercent?.(value as number)
              }
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
              onSubmit={(value) =>
                isEditMode
                  ? aplyGlobalDiscount?.(value as number, "amount")
                  : setDiscountAmount?.(value as number)
              }
              className="w-full"
              buttonClassName="w-full"
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subtotal</Label>
            <Badge
              variant={"secondary"}
              className="w-full h-8 rounded-sm text-sm font-normal"
            >
              {formatCurrency(subtotal)}
            </Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Total</Label>
            <Badge
              variant={"success"}
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
                className="text-xs h-7 px-2 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950 hover:text-orange-600 dark:hover:text-orange-200 transition-colors duration-300"
                onClick={() =>
                  isEditMode
                    ? aplyGlobalDiscount?.(percentage, "percentage")
                    : setDiscountPercent?.(percentage)
                }
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
              onClick={handleSecondaryAction}
            >
              {finalSecondaryButtonText}
            </Button>

            {/* Botón de submit */}
            <TooltipButton
              buttonProps={{
                type: "submit",
                disabled: isPending || !hasProducts || isReadOnly,
                variant: "default",
                className: "w-full",
              }}
              tooltip={
                <span className="flex items-center gap-1">
                  {tooltipText} <ShortcutKey combo="alt+s" />
                </span>
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {submitButtonPendingText}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <Edit className="mr-2 size-4" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  {submitButtonText}
                </>
              )}
            </TooltipButton>
          </div>
        </footer>
      </CardContent>
    </Card>
  );
};

export default SalesSummary;
