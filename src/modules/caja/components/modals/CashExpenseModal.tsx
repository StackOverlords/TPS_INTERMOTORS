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
import { useNavigate } from "react-router";
import { useRegisterExpense } from "../../hooks/useRegisterExpense";
import { useExpenseTypes } from "../../hooks/useExpenseTypes";
import type { PaymentType } from "../../types/cashMovement.types";

interface CashExpenseModalProps {
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
  caja_gasto_tipo_id: "" as number | "",
  monto: "",
  forma_pago: "" as PaymentType | "",
  descripcion: "",
};

export function CashExpenseModal({
  isOpen,
  onClose,
  sessionId,
  branchId,
}: CashExpenseModalProps) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const navigate = useNavigate();

  const { mutate: registerExpense, isPending } = useRegisterExpense();
  const { data: expenseTypes = [], isLoading: isLoadingTypes } = useExpenseTypes();

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
    if (!formData.caja_gasto_tipo_id) return;
    if (!formData.forma_pago) return;

    registerExpense(
      {
        sessionId,
        data: {
          unidad_organizativa_id: branchId,
          caja_gasto_tipo_id: Number(formData.caja_gasto_tipo_id),
          monto,
          forma_pago: formData.forma_pago as PaymentType,
          ...(formData.descripcion.trim()
            ? { descripcion: formData.descripcion.trim() }
            : {}),
        },
      },
      {
        onSuccess: () => {
          showSuccessToast({
            title: "Gasto registrado",
            description: "El gasto fue registrado correctamente.",
          });
          resetForm();
          onClose();
        },
        onError: (error: any) => {
          const validationMsg = error?.response?.data?.errors?.monto?.[0]
            ?? error?.response?.data?.message;
          showErrorToast({
            title: "Error al registrar gasto",
            description: validationMsg || "Ocurrió un error al registrar el gasto.",
          });
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md" aria-describedby="cash-expense-description">
        <p id="cash-expense-description" className="sr-only">
          Formulario para registrar un gasto de caja.
        </p>
        <DialogHeader>
          <DialogTitle>Registrar Gasto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Tipo de Gasto <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate("/dashboard/caja/tipos-gasto");
                }}
                className="text-xs text-primary hover:underline"
              >
                Gestionar tipos →
              </button>
            </div>
            <ComboboxSelect
              value={formData.caja_gasto_tipo_id}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  caja_gasto_tipo_id: Number(val),
                }))
              }
              options={expenseTypes.filter((t) => t.activo)}
              optionTag="nombre"
              placeholder="Seleccionar tipo de gasto..."
              isLoadingData={isLoadingTypes}
              disabled={isPending || isLoadingTypes}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-monto">
              Monto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expense-monto"
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
            <Label htmlFor="expense-descripcion">Descripción</Label>
            <Input
              id="expense-descripcion"
              type="text"
              maxLength={500}
              placeholder="Descripción opcional..."
              value={formData.descripcion}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
              }
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
              {isPending ? "Registrando..." : "Registrar Gasto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
