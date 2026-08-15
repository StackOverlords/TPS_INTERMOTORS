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
import {
  BrushCleaning,
  ListChecks,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import { useOrderCart } from "../hooks/useOrderCart";
import { OrderCartItemRow } from "./OrderCartItemRow";

interface OrderCartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: number;
  transferDisabled?: boolean;
  /** Productos que ya fueron transferidos al borrador actual. */
  excludedProductIds?: ReadonlySet<number>;
  /**
   * Cuando se provee, agrega una acción de traspaso en el footer.
   * Este componente NO sabe nada de pedidos/`useOrderDetails` — solo
   * entrega el subconjunto de ids seleccionados. `OrderCartTransferButton`
   * es quien la usa para exponer esa selección hacia `orderCreateScreen`.
   */
  onTransferSelected?: (selectedIds: number[]) => void;
  transferLabel?: string;
  /**
   * Habilita el tildado ítem por ítem. Apagado por defecto: el traspaso
   * normal es "traer todo" de un click, y obligar a seleccionar uno por uno
   * duplica el trabajo. Se conserva detrás del flag
   * `seedFromOrderCartSelective` para un posible uso futuro.
   */
  allowSelective?: boolean;
}

/**
 * Panel del carrito de pedido: lista, edición de cantidad, remove-one,
 * "vaciar carrito" y checkbox de selección por ítem (para el traspaso).
 * Selector-based: consume `useOrderCart()` acá arriba y le pasa a cada
 * `OrderCartItemRow` solo lo que necesita — la fila no toca el store.
 */
export const OrderCartSheet: React.FC<OrderCartSheetProps> = ({
  open,
  onOpenChange,
  branchId,
  transferDisabled = false,
  excludedProductIds,
  onTransferSelected,
  transferLabel = "Traer al pedido",
  allowSelective = false,
}) => {
  const { items, updateCantidad, removeItem, removeMany, clear } =
    useOrderCart(branchId);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const availableItems = excludedProductIds
    ? items.filter((item) => !excludedProductIds.has(item.product.id))
    : items;
  const selectedAvailableIds = availableItems
    .map((item) => item.product.id)
    .filter((productId) => selectedIds.has(productId));

  useEffect(() => {
    if (!open) setSelectedIds(new Set());
  }, [open]);

  const toggleSelect = (productId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleTransferSelected = () => {
    if (!onTransferSelected || selectedAvailableIds.length === 0) return;
    onTransferSelected(selectedAvailableIds);
    setSelectedIds(new Set());
  };

  const handleTransferAll = () => {
    if (!onTransferSelected || availableItems.length === 0) return;
    onTransferSelected(availableItems.map((item) => item.product.id));
    setSelectedIds(new Set());
  };

  const handleClear = () => {
    if (!excludedProductIds) {
      clear();
      return;
    }

    removeMany(availableItems.map((item) => item.product.id));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        hasButtonClose={false}
        className="w-[400px] sm:w-[500px] h-full sm:h-[98vh] sm:mr-2 sm:my-auto sm:rounded-lg flex flex-col p-3 gap-2"
      >
        <SheetHeader className="flex flex-col flex-shrink-0">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrito de pedido
            </div>
            <div className="flex items-center gap-2">
              {availableItems.length > 0 && (
                <Button
                  type="button"
                  className="cursor-pointer"
                  onClick={handleClear}
                  variant="destructive"
                >
                  <BrushCleaning />
                  {excludedProductIds ? "Vaciar disponibles" : "Vaciar carrito"}
                </Button>
              )}
              <SheetClose className="size-8 rounded-sm ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </SheetClose>
            </div>
          </SheetTitle>
          <SheetDescription className="-mt-2 text-left">
            {availableItems.length} producto
            {availableItems.length === 1 ? "" : "s"}{" "}
            {excludedProductIds
              ? `disponible${availableItems.length === 1 ? "" : "s"}`
              : "en el carrito"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {availableItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground h-full flex flex-col justify-center items-center">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>El carrito de pedido está vacío</p>
            </div>
          ) : (
            <div className="overflow-y-auto h-full flex flex-col gap-2">
              {availableItems.map((item) => (
                <OrderCartItemRow
                  key={`order-cart-item-${item.product.id}`}
                  item={item}
                  selected={selectedIds.has(item.product.id)}
                  onToggleSelect={allowSelective ? toggleSelect : undefined}
                  onUpdateCantidad={updateCantidad}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {onTransferSelected && availableItems.length > 0 && (
          <SheetFooter className="flex-shrink-0 border-t border-border pt-2 flex flex-col gap-2">
            <Button
              type="button"
              className="w-full cursor-pointer"
              onClick={handleTransferAll}
              disabled={transferDisabled}
            >
              <Truck />
              {transferLabel} todo ({availableItems.length})
            </Button>

            {allowSelective && (
              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                disabled={transferDisabled || selectedAvailableIds.length === 0}
                onClick={handleTransferSelected}
              >
                <ListChecks />
                Traer seleccionados ({selectedAvailableIds.length})
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default OrderCartSheet;
