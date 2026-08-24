import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Badge } from "@/components/atoms/badge";
import { ShoppingCart, TriangleAlert } from "lucide-react";
import type { OrderCartProduct } from "../types/orderCart.types";

interface OrderCartQuantityDialogProps {
  /** `null` mantiene el diálogo cerrado. El producto es la fuente del open. */
  product: OrderCartProduct | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (cantidad: number) => void;
  /** Cantidad que el producto ya acumula en la lista, si ya estaba. */
  cantidadActual?: number;
}

const DEFAULT_CANTIDAD = "1";

/**
 * Pregunta la cantidad antes de mandar un producto a la lista de compras.
 *
 * Sin este paso, agregar desde el listado metía siempre 1 unidad y obligaba
 * a corregirla después dentro de la lista.
 *
 * No toca el store: recibe el producto y devuelve la cantidad por
 * `onConfirm`. Quien lo monta decide qué hacer con ella.
 */
export const OrderCartQuantityDialog: React.FC<
  OrderCartQuantityDialogProps
> = ({ product, onOpenChange, onConfirm, cantidadActual = 0 }) => {
  const [cantidad, setCantidad] = useState(DEFAULT_CANTIDAD);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reinicia en cada apertura: sin esto el diálogo recordaría la cantidad
  // tipeada para el producto anterior.
  useEffect(() => {
    if (!product) return;
    setCantidad(DEFAULT_CANTIDAD);
    // El foco va después del montaje del portal de Radix.
    const timer = setTimeout(() => inputRef.current?.select(), 50);
    return () => clearTimeout(timer);
  }, [product]);

  const parsed = Number(cantidad);
  const isValid = Number.isFinite(parsed) && parsed > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(parsed);
    onOpenChange(false);
  };

  if (!product) return null;

  const warnings: string[] = [];
  if (product.pedido_transito > 0) {
    warnings.push(`${product.pedido_transito} en camino`);
  }
  if (product.pedido_almacen > 0) {
    warnings.push(`${product.pedido_almacen} en almacén`);
  }

  return (
    <Dialog open={Boolean(product)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Agregar a la lista de compras
          </DialogTitle>
          <DialogDescription className="text-left">
            {product.descripcion}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {product.codigo_oem && (
              <Badge variant="outline">OEM: {product.codigo_oem}</Badge>
            )}
            {product.marca && <Badge variant="outline">{product.marca}</Badge>}
            <Badge variant="outline">Stock: {product.stock_actual}</Badge>
          </div>

          {warnings.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Ya hay {warnings.join(" y ")}.</span>
            </div>
          )}

          {cantidadActual > 0 && (
            <p className="text-xs text-muted-foreground">
              Este producto ya está en la lista con{" "}
              <strong>{cantidadActual}</strong> unidad
              {cantidadActual === 1 ? "" : "es"}. Lo que pongas acá se suma.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-cart-cantidad">Cantidad a pedir</Label>
            <Input
              id="order-cart-cantidad"
              ref={inputRef}
              type="number"
              min={1}
              step={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />
            {!isValid && cantidad !== "" && (
              <p className="text-xs text-destructive">
                La cantidad tiene que ser mayor a cero.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            disabled={!isValid}
            onClick={handleConfirm}
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderCartQuantityDialog;
