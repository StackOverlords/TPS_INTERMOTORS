import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { Truck } from "lucide-react";
import { useOrderCart } from "../hooks/useOrderCart";
import { OrderCartSheet } from "./OrderCartSheet";

interface OrderCartTransferButtonProps {
  /**
   * Recibe el subconjunto de ids a traer. Este componente NO conoce
   * `useOrderDetails` ni el contrato de detalle de pedido — la lógica de
   * traspaso (mapeo `{ ...product, quantity: cantidad }`,
   * `addMultipleProducts` y limpieza tras el registro) vive en
   * `orderCreateScreen`.
   */
  onTransfer: (selectedIds: number[]) => void;
  /**
   * Habilita el tildado ítem por ítem dentro del panel. Apagado por
   * defecto: la acción normal es "traer todo" de un click desde el panel.
   * Se conserva detrás del flag `seedFromOrderCartSelective`.
   */
  allowSelective?: boolean;
  /** Productos que ya están dentro del borrador actual. */
  excludedProductIds?: ReadonlySet<number>;
  branchId?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * "Traer del carrito (N)" — pensado para montarse en `orderCreateScreen`.
 * Oculto cuando el carrito no está listo o está vacío.
 *
 * Abre `OrderCartSheet`, donde el usuario ve qué hay acumulado y lo trae
 * todo de un click. La selección por ítem vive detrás de `allowSelective`.
 */
export const OrderCartTransferButton: React.FC<
  OrderCartTransferButtonProps
> = ({
  onTransfer,
  allowSelective = false,
  excludedProductIds,
  branchId,
  disabled = false,
  className,
}) => {
  const { items, isReady } = useOrderCart(branchId);
  const [open, setOpen] = useState(false);
  const availableCount = excludedProductIds
    ? items.filter((item) => !excludedProductIds.has(item.product.id)).length
    : items.length;

  if (!isReady || availableCount === 0) return null;

  return (
    <>
      <Button
        // El componente se monta DENTRO del <form> de orderCreateScreen. Sin
        // type="button" el default de HTML es "submit" y abrir el panel
        // dispararia la validacion del formulario.
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Truck className="h-4 w-4" />
        Traer del carrito ({availableCount})
      </Button>

      <OrderCartSheet
        open={open}
        onOpenChange={setOpen}
        transferLabel="Traer al pedido"
        allowSelective={allowSelective}
        excludedProductIds={excludedProductIds}
        branchId={branchId}
        transferDisabled={disabled}
        onTransferSelected={(selectedIds) => {
          onTransfer(selectedIds);
          setOpen(false);
        }}
      />
    </>
  );
};

export default OrderCartTransferButton;
