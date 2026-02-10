import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/atoms/sheet";
import { cn } from "@/lib/utils";
import { BrushCleaning, Maximize2, ShoppingCart, X } from "lucide-react";
import CartItemComponent from "./cartItemComponent";
import { Label } from "@/components/atoms/label";
import { useNavigate } from "react-router";
import { useCartWithUtils } from "../hooks/useCartWithUtils";
import authSDK from "@/services/sdk-simple-auth";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";
import { useBranchStore } from "@/states/branchStore";
import { EditablePercentage } from "./EditablePercentage";
import { EditablePrice } from "./editablePrice";
import { formatCurrency } from "@/utils/formaters";
import { Badge } from "@/components/atoms/badge";
import { CartActionBar } from "./CartActionBar";

const CartSidebar = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const user = authSDK.getCurrentUser();
  const { enableScope, disableScope } = useHotkeysContext();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [expandedView, setExpandedView] = useState(false);
  const navigate = useNavigate();
  const {
    items: cart,
    getCartSubtotal,
    getCartTotal,
    discountAmount,
    discountPercent,
    updateQuantity,
    removeItem,
    updateCustomPrice,
    updateCustomSubtotal,
    setDiscountAmount,
    setDiscountPercent,
    clearCart,
  } = useCartWithUtils(user?.name || "", selectedBranchId ?? "");

  useHotkeys(
    "escape",
    (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();

      // Si el foco está en input, textarea o select, no ejecutar el handler
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
    },
    {
      scopes: ["cart-sidebar"],
      enabled: open,
      preventDefault: true,
      keydown: true,
      keyup: false,
      enableOnFormTags: false,
    }
  );

  useEffect(() => {
    if (open) {
      enableScope("cart-sidebar");
      disableScope("esc-key");
    } else {
      disableScope("cart-sidebar");
      setTimeout(() => {
        enableScope("esc-key");
      }, 100);
    }
  }, [open, enableScope, disableScope]);

  const subtotal = getCartSubtotal();
  const total = getCartTotal();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        hasButtonClose={false}
        className={cn(
          "w-[400px] sm:w-[600px] sm:max-w-7xl h-full sm:h-[98vh] sm:mr-2 sm:my-auto sm:rounded-lg flex flex-col p-3 gap-2",
          expandedView && "sm:w-[800px] lg:w-[1000px]"
        )}
      >
        <SheetHeader className="flex flex-col flex-shrink-0">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrito de ventas
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <>
                  <Button
                    className="cursor-pointer"
                    onClick={clearCart}
                    variant={"destructive"}
                  >
                    <BrushCleaning />
                    Limpiar
                  </Button>
                  <Button
                    className="size-8 cursor-pointer"
                    variant="outline"
                    onClick={() => setExpandedView(!expandedView)}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <SheetClose className="size-8 rounded-sm ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </SheetClose>
            </div>
          </SheetTitle>
          <SheetDescription className="-mt-2 text-left">
            {cart.length} productos en el carrito
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground h-full flex flex-col justify-center items-center">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div className="overflow-y-auto h-full flex flex-col gap-2">
              {cart.map((item) => (
                <CartItemComponent
                  key={`item-${item.product.id}`}
                  item={item}
                  removeItem={removeItem}
                  updateQuantity={updateQuantity}
                  updateCustomPrice={updateCustomPrice}
                  updateCustomSubtotal={updateCustomSubtotal}
                />
              ))}
            </div>
          )}
        </div>
        <SheetFooter className="flex flex-col flex-shrink-0 border-t border-border pt-2">
          <div className="space-y-2 w-full">
            {cart.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
            )}

            <CartActionBar
              onAction={(path) => {
                navigate(path);
                onOpenChange(false);
              }}
            />
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;
