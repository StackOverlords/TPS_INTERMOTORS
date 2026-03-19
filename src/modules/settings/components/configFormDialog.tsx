import type {
  UseFormRegister,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form";
import type { DialogConfig } from "../types/configFormDialog.types";
import { Button } from "@/components/atoms/button";
import { Loader2, Plus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms/dialog";
import { Label } from "@/components/atoms/label";
import { Input } from "@/components/atoms/input";

interface ConfigFormDialogProps<T extends FieldValues> {
  config: DialogConfig;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  isLoading?: boolean;
  triggerButton?: React.ReactNode;
  isEditing?: boolean;
  editingId?: string | number | null;
  isSaving?: boolean;
  children?: React.ReactNode;
}

export function ConfigFormDialog<T extends FieldValues>({
  config,
  isOpen,
  onOpenChange,
  onSubmit,
  register,
  errors,
  isLoading = false,
  triggerButton,
  isEditing = false,
  editingId,
  isSaving = false,
  children,
}: ConfigFormDialogProps<T>) {
  const defaultTrigger = (
    <Button className="w-full sm:w-auto">
      <Plus className="size-4" />
      Agregar
    </Button>
  );

  const fieldName = config.field.name as Path<T>;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{triggerButton || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Agregar"} {config.title}
            {isEditing && editingId && (
              <span className="text-muted-foreground ml-2">#{editingId}</span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica" : "Agrega"} {config.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor={config.field.name}>
              {config.field.label} {config.field.required && "*"}
            </Label>
            {isEditing && isLoading ? (
              <div className="flex items-center justify-start px-2 h-8 gap-3 rounded-md animate-pulse bg-accent">
                <p className="text-sm text-muted-foreground">
                  Cargando datos...
                </p>
              </div>
            ) : (
              <>
                <Input
                  id={config.field.name}
                  {...register(fieldName)}
                  placeholder={config.field.placeholder}
                  disabled={isLoading}
                  autoFocus={true}
                />
                {errors[fieldName] && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    {errors[fieldName]?.message as string}
                  </p>
                )}
              </>
            )}
          </div>

          {children}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className=" size-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {isEditing ? "Actualizar" : "Crear"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
