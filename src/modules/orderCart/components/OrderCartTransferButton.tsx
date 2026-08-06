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
   * `addMultipleProducts`, `removeMany`) vive en `orderCreateScreen`
   * (Fase 3, defect compensations 1 y 2).
   */
  onTransfer: (selectedIds: number[]) => void;
  /**
   * Habilita el tildado ítem por ítem dentro del panel. Apagado por
   * defecto: la acción normal es "traer todo" de un click desde el panel.
   * Se conserva detrás del flag `seedFromOrderCartSelective`.
   */
  allowSelective?: boolean;
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
> = ({ onTransfer, allowSelective = false, className }) => {
  const { count, isReady } = useOrderCart();
  const [open, setOpen] = useState(false);

  if (!isReady || count === 0) return null;

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
      >
        <Truck className="h-4 w-4" />
        Traer del carrito ({count})
      </Button>

      <OrderCartSheet
        open={open}
        onOpenChange={setOpen}
        transferLabel="Traer al pedido"
        allowSelective={allowSelective}
        onTransferSelected={(selectedIds) => {
          onTransfer(selectedIds);
          setOpen(false);
        }}
      />
    </>
  );
};

export default OrderCartTransferButton;
