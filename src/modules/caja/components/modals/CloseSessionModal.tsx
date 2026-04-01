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
import { AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/hooks/use-toast-enhanced";
import { useCloseCashSession } from "../../hooks/useCloseCashSession";

interface CloseSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  saldoSistema: number;
}

const INITIAL_STATE = {
  monto_declarado: "",
  observaciones_cierre: "",
};

export function CloseSessionModal({
  isOpen,
  onClose,
  sessionId,
  saldoSistema,
}: CloseSessionModalProps) {
  const [formData, setFormData] = useState(INITIAL_STATE);

  const { mutate: closeSession, isPending } = useCloseCashSession();

  const montoDec = Number(formData.monto_declarado) || 0;
  const diferencia = montoDec - saldoSistema;
  const hasMontoDec = formData.monto_declarado !== "";

  const resetForm = () => {
    setFormData(INITIAL_STATE);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const monto = Number(formData.monto_declarado);
    if (isNaN(monto) || monto < 0) return;

    closeSession(
      {
        id: sessionId,
        data: {
          monto_declarado: monto,
          ...(formData.observaciones_cierre.trim()
            ? { observaciones_cierre: formData.observaciones_cierre.trim() }
            : {}),
        },
      },
      {
        onSuccess: () => {
          showSuccessToast({
            title: "Caja cerrada",
            description: "La sesión de caja fue cerrada correctamente.",
          });
          resetForm();
          onClose();
        },
        onError: (error) => {
          showErrorToast({
            title: "Error al cerrar caja",
            description: error.message || "Ocurrió un error al cerrar la sesión.",
          });
        },
      }
    );
  };

  const getDiferenciaClass = () => {
    if (!hasMontoDec) return "text-muted-foreground";
    if (diferencia < 0) return "text-destructive font-semibold";
    if (diferencia > 0) return "text-green-600 dark:text-green-400 font-semibold";
    return "text-muted-foreground font-semibold";
  };

  const getDiferenciaText = () => {
    if (!hasMontoDec) return "—";
    if (diferencia === 0) return "Cuadra perfecto ✓";
    return `Bs ${diferencia.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md" aria-describedby="close-session-description">
        <p id="close-session-description" className="sr-only">
          Formulario para cerrar la sesión de caja activa.
        </p>
        <DialogHeader>
          <DialogTitle>Cerrar Caja</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Saldo sistema (read-only info) */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo Sistema:</span>
              <span className="font-semibold">Bs {saldoSistema.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diferencia estimada:</span>
              <span className={getDiferenciaClass()}>{getDiferenciaText()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monto_declarado">
              Monto Declarado <span className="text-destructive">*</span>
            </Label>
            <Input
              id="monto_declarado"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={formData.monto_declarado}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, monto_declarado: e.target.value }))
              }
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones_cierre">Observaciones de Cierre</Label>
            <Textarea
              id="observaciones_cierre"
              placeholder="Observaciones opcionales..."
              maxLength={500}
              value={formData.observaciones_cierre}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  observaciones_cierre: e.target.value,
                }))
              }
              disabled={isPending}
              rows={3}
            />
          </div>

          {/* Warning when diferencia != 0 */}
          {hasMontoDec && diferencia !== 0 && (
            <div className="flex gap-2 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950 p-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                La diferencia no es cero. ¿Estás seguro de continuar?
              </p>
            </div>
          )}

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
              {isPending ? "Cerrando..." : "Cerrar Caja"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
