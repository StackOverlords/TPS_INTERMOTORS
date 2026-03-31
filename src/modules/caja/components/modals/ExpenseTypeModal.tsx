import { useState, useEffect } from "react";
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
import { useCreateExpenseType } from "../../hooks/useCreateExpenseType";
import { useUpdateExpenseType } from "../../hooks/useUpdateExpenseType";
import type { ExpenseType } from "../../types/expenseType.types";

interface ExpenseTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: number;
  expenseType?: ExpenseType;
}

const INITIAL_STATE = {
  nombre: "",
  descripcion: "",
};

export function ExpenseTypeModal({
  isOpen,
  onClose,
  branchId,
  expenseType,
}: ExpenseTypeModalProps) {
  const isEditMode = !!expenseType;

  const [formData, setFormData] = useState(INITIAL_STATE);

  const { mutate: createExpenseType, isPending: isCreating } = useCreateExpenseType();
  const { mutate: updateExpenseType, isPending: isUpdating } = useUpdateExpenseType();

  const isPending = isCreating || isUpdating;

  // Populate form when editing
  useEffect(() => {
    if (expenseType && isOpen) {
      setFormData({
        nombre: expenseType.nombre,
        descripcion: expenseType.descripcion ?? "",
      });
    } else if (!isOpen) {
      setFormData(INITIAL_STATE);
    }
  }, [expenseType, isOpen]);

  const resetForm = () => {
    setFormData(INITIAL_STATE);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) return;

    if (isEditMode && expenseType) {
      updateExpenseType(
        {
          id: expenseType.id,
          data: {
            unidad_organizativa_id: branchId,
            nombre: formData.nombre.trim(),
            ...(formData.descripcion.trim()
              ? { descripcion: formData.descripcion.trim() }
              : {}),
          },
        },
        {
          onSuccess: () => {
            showSuccessToast({
              title: "Tipo de gasto actualizado",
              description: "El tipo de gasto fue actualizado correctamente.",
            });
            resetForm();
            onClose();
          },
          onError: (error) => {
            showErrorToast({
              title: "Error al actualizar",
              description:
                error.message || "Ocurrió un error al actualizar el tipo de gasto.",
            });
          },
        }
      );
    } else {
      createExpenseType(
        {
          unidad_organizativa_id: branchId,
          nombre: formData.nombre.trim(),
          ...(formData.descripcion.trim()
            ? { descripcion: formData.descripcion.trim() }
            : {}),
        },
        {
          onSuccess: () => {
            showSuccessToast({
              title: "Tipo de gasto creado",
              description: "El tipo de gasto fue creado correctamente.",
            });
            resetForm();
            onClose();
          },
          onError: (error) => {
            showErrorToast({
              title: "Error al crear",
              description:
                error.message || "Ocurrió un error al crear el tipo de gasto.",
            });
          },
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md" aria-describedby="expense-type-description">
        <p id="expense-type-description" className="sr-only">
          Formulario para {isEditMode ? "editar" : "crear"} un tipo de gasto.
        </p>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Tipo de Gasto" : "Nuevo Tipo de Gasto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-type-nombre">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expense-type-nombre"
              type="text"
              maxLength={150}
              placeholder="Nombre del tipo de gasto..."
              value={formData.nombre}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nombre: e.target.value }))
              }
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-type-descripcion">Descripción</Label>
            <Textarea
              id="expense-type-descripcion"
              placeholder="Descripción opcional..."
              maxLength={500}
              value={formData.descripcion}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  descripcion: e.target.value,
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
              {isPending
                ? isEditMode
                  ? "Actualizando..."
                  : "Creando..."
                : isEditMode
                  ? "Guardar Cambios"
                  : "Crear Tipo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
