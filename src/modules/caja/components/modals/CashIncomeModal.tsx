import { useState } from "react";
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
import { useRegisterIncome } from "../../hooks/useRegisterIncome";

interface CashIncomeModalProps {
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

export function CashIncomeModal({
  isOpen,
  onClose,
  sessionId,
  branchId,
}: CashIncomeModalProps) {
  const [formData, setFormData] = useState(INITIAL_STATE);

  const { mutate: registerIncome, isPending } = useRegisterIncome();

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

    registerIncome(
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
            title: "Ingreso registrado",
            description: "El ingreso fue registrado correctamente.",
          });
          resetForm();
          onClose();
        },
        onError: (error) => {
          showErrorToast({
            title: "Error al registrar ingreso",
            description: error.message || "Ocurrió un error al registrar el ingreso.",
          });
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md" aria-describedby="cash-income-description">
        <p id="cash-income-description" className="sr-only">
          Formulario para registrar un ingreso de caja.
        </p>
        <DialogHeader>
          <DialogTitle>Registrar Ingreso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-monto">
              Monto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="income-monto"
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
                setFormData((prev) => ({ ...prev, forma_pago: String(val) }))
              }
              options={PAYMENT_OPTIONS}
              optionTag="label"
              placeholder="Seleccionar forma de pago..."
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-descripcion">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Input
              id="income-descripcion"
              type="text"
              maxLength={500}
              placeholder="Descripción del ingreso..."
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
              {isPending ? "Registrando..." : "Registrar Ingreso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
