import { useState } from "react";
import type { PaymentType } from "../../types/cashMovement.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Loader2 } from "lucide-react";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { showSuccessToast, showErrorToast } from "@/hooks/use-toast-enhanced";
import { useRegisterWithdrawal } from "../../hooks/useRegisterWithdrawal";

interface CashWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  branchId: number;
}

const PAYMENT_OPTIONS = [
  { id: "EFECTIVO", label: "Efectivo" },
  { id: "CHEQUE", label: "Cheque" },
  { id: "TRASNF", label: "Transferencia" },
  { id: "QR", label: "QR" },
  { id: "QR-EFECT", label: "QR-Efectivo" },
];

const INITIAL_STATE = {
  monto: "",
  forma_pago: "",
  descripcion: "",
};

export function CashWithdrawalModal({
  isOpen,
  onClose,
  sessionId,
  branchId,
}: CashWithdrawalModalProps) {
  const [formData, setFormData] = useState(INITIAL_STATE);

  const { mutate: registerWithdrawal, isPending } = useRegisterWithdrawal();

  const resetForm = () => {
    setFormData(INITIAL_STATE);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const monto = Number(formData.monto);
    if (isNaN(monto) || monto <= 0) return;
    if (!formData.forma_pago) return;
    if (!formData.descripcion.trim()) return;

    registerWithdrawal(
      {
        sessionId,
        data: {
          unidad_organizativa_id: branchId,
          monto,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          forma_pago: formData.forma_pago as any,
          descripcion: formData.descripcion.trim(),
        },
      },
      {
        onSuccess: () => {
          showSuccessToast({
            title: "Retiro registrado",
            description: "El retiro fue registrado correctamente.",
          });
          resetForm();
          onClose();
        },
        onError: (error) => {
          showErrorToast({
            title: "Error al registrar retiro",
            description: error.message || "Ocurrió un error al registrar el retiro.",
          });
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md" aria-describedby="cash-withdrawal-description">
        <p id="cash-withdrawal-description" className="sr-only">
          Formulario para registrar un retiro de caja.
        </p>
        <DialogHeader>
          <DialogTitle>Registrar Retiro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdrawal-monto">
              Monto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="withdrawal-monto"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="0.00"
              value={formData.monto}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, monto: e.target.value }))
              }
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Forma de Pago <span className="text-destructive">*</span>
            </Label>
            <ComboboxSelect
              value={formData.forma_pago}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, forma_pago: val as PaymentType }))
              }
              options={PAYMENT_OPTIONS}
              optionTag="label"
              placeholder="Seleccionar forma de pago..."
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdrawal-descripcion">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Input
              id="withdrawal-descripcion"
              type="text"
              maxLength={500}
              placeholder="Descripción del retiro..."
              value={formData.descripcion}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
              }
              required
              disabled={isPending}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Registrando..." : "Registrar Retiro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
