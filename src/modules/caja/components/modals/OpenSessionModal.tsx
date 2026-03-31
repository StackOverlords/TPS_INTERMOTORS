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
import { Textarea } from "@/components/atoms/textarea";
import { Loader2 } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/hooks/use-toast-enhanced";
import { useOpenCashSession } from "../../hooks/useOpenCashSession";

interface OpenSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: number;
}

const INITIAL_STATE = {
  monto_apertura: "",
  observaciones_apertura: "",
};

export function OpenSessionModal({ isOpen, onClose, branchId }: OpenSessionModalProps) {
  const [formData, setFormData] = useState(INITIAL_STATE);

  const { mutate: openSession, isPending } = useOpenCashSession();

  const resetForm = () => {
    setFormData(INITIAL_STATE);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const monto = Number(formData.monto_apertura);
    if (isNaN(monto) || monto < 0) return;

    openSession(
      {
        unidad_organizativa_id: branchId,
        monto_apertura: monto,
        ...(formData.observaciones_apertura.trim()
          ? { observaciones_apertura: formData.observaciones_apertura.trim() }
          : {}),
      },
      {
        onSuccess: () => {
          showSuccessToast({
            title: "Caja abierta",
            description: "La sesión de caja fue abierta correctamente.",
          });
          resetForm();
          onClose();
        },
        onError: (error) => {
          showErrorToast({
            title: "Error al abrir caja",
            description: error.message || "Ocurrió un error al abrir la sesión.",
          });
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md" aria-describedby="open-session-description">
        <p id="open-session-description" className="sr-only">
          Formulario para abrir una nueva sesión de caja.
        </p>
        <DialogHeader>
          <DialogTitle>Abrir Caja</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monto_apertura">
              Monto de Apertura <span className="text-destructive">*</span>
            </Label>
            <Input
              id="monto_apertura"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={formData.monto_apertura}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, monto_apertura: e.target.value }))
              }
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones_apertura">Observaciones</Label>
            <Textarea
              id="observaciones_apertura"
              placeholder="Observaciones opcionales..."
              maxLength={500}
              value={formData.observaciones_apertura}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  observaciones_apertura: e.target.value,
                }))
              }
              disabled={isPending}
              rows={3}
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
              {isPending ? "Abriendo..." : "Abrir Caja"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
