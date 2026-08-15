import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Checkbox } from "@/components/atoms/checkbox";
import { Label } from "@/components/atoms/label";
import { EditableField } from "@/components/common/EditableField";
import { formatDate } from "@/utils/formaters";
import { Trash2, TriangleAlert } from "lucide-react";
import type { OrderCartItem } from "../types/orderCart.types";

interface OrderCartItemRowProps {
  item: OrderCartItem;
  selected?: boolean;
  /**
   * Cuando no se provee, la fila no muestra checkbox. Es el modo por
   * defecto: el traspaso trae el carrito completo, así que no hay nada
   * que tildar.
   */
  onToggleSelect?: (productId: number) => void;
  onUpdateCantidad: (productId: number, cantidad: number) => void;
  onRemove: (productId: number) => void;
}

/**
 * Fila de solo props — no toca el store. `OrderCartSheet` (el consumidor)
 * es quien lee `useOrderCart()` y le pasa acá item + callbacks, igual que
 * `cartItemComponent.tsx` en el carrito de ventas.
 */
export const OrderCartItemRow: React.FC<OrderCartItemRowProps> = ({
  item,
  selected = false,
  onToggleSelect,
  onUpdateCantidad,
  onRemove,
}) => {
  const { product, cantidad, addedAt } = item;

  const warnings: string[] = [];
  if (product.pedido_transito > 0) {
    warnings.push(`Ya hay ${product.pedido_transito} en camino`);
  }
  if (product.pedido_almacen > 0) {
    warnings.push(`Ya hay ${product.pedido_almacen} en almacén`);
  }

  return (
    <div className="border-border rounded-lg p-1.5 border">
      <div className="flex items-start gap-2">
        {onToggleSelect && (
          <Checkbox
            className="mt-1"
            checked={selected}
            onCheckedChange={() => onToggleSelect(product.id)}
          />
        )}

        <div className="flex-1">
          <h4 className="text-xs font-medium text-foreground mb-1">
            {product.descripcion}
          </h4>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-[10px]">
              {product.codigo_oem}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {product.marca}
            </span>
            <Badge variant="outline" className="text-[10px]">
              Stock: {product.stock_actual}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              Agregado: {formatDate(addedAt)}
            </span>
          </div>

          {warnings.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {warnings.map((warning) => (
                <Badge
                  key={warning}
                  variant="warning"
                  className="text-[10px] gap-1"
                >
                  <TriangleAlert className="size-3" />
                  {warning}
                </Badge>
              ))}
            </div>
          )}

          <div className="max-w-[120px]">
            <Label className="text-xs text-foreground mb-1">Cantidad</Label>
            <EditableField
              type="number"
              value={cantidad}
              numberProps={{ min: 1, step: 1 }}
              formatter={(value) => value.toString()}
              focusNextOnEnter
              className="w-full"
              buttonClassName="w-full"
              validate={(val) => {
                const num = parseInt(val, 10);
                return !isNaN(num) && num > 0;
              }}
              onSubmit={(value) =>
                onUpdateCantidad(product.id, value as number)
              }
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRemove(product.id)}
          className="text-red-500 hover:text-red-500 size-7 dark:text-red-400 dark:hover:text-red-400"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  );
};

export default OrderCartItemRow;
