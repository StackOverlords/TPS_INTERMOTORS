import { useState } from "react";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { ShoppingCart } from "lucide-react";
import { useOrderCart } from "../hooks/useOrderCart";
import { OrderCartSheet } from "./OrderCartSheet";

/**
 * Trigger + badge de conteo + panel, autocontenido (mismo espíritu que
 * `NotificationsPanel`: el que lo monta no necesita manejar estado de
 * apertura). Oculto cuando `count === 0` o `!isReady` (sin scope
 * resuelto todavía — ver design D2).
 */
export const OrderCartBadgeButton: React.FC = () => {
  const { count, isReady } = useOrderCart();
  const [open, setOpen] = useState(false);

  if (!isReady || count === 0) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative size-8 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <ShoppingCart className="h-4 w-4" />
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {count}
        </Badge>
      </Button>

      <OrderCartSheet open={open} onOpenChange={setOpen} />
    </>
  );
};

export default OrderCartBadgeButton;
