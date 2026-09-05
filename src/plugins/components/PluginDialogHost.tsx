/**
 * PluginDialogHost — Componente host para los diálogos del sistema de plugins.
 *
 * RESPONSABILIDADES:
 * - Suscribirse a `usePluginDialogStore` y renderizar el diálogo activo.
 * - Para `type: "confirm"`: renderiza `AlertDialog` de Radix/shadcn (alert-dialog.tsx).
 * - Para `type: "prompt"`: renderiza `Dialog` de Radix/shadcn (dialog.tsx) con campos de formulario.
 * - Al confirmar o cancelar, llama `resolveDialog()` para resolver la Promise colgante.
 *
 * MONTAJE: Se monta UNA vez en main.tsx al lado del <Toaster/>, mismo nivel de providers.
 * No tiene estado propio — todo el estado vive en pluginDialogStore.
 *
 * CAMPOS DE PROMPT: Soporta los tipos definidos en PromptField del SDK:
 *   "text" | "password" | "email" | "number" | "textarea"
 * Enter en el último campo confirma el formulario. Escape cierra (cancela).
 *
 * ACCESIBILIDAD: AlertDialog de Radix es modal con foco atrapado + aria correctos por defecto.
 * Dialog de Radix ídem. No agregamos aria extra salvo lo que ya traen los primitivos.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/atoms/alert-dialog";
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
import { Textarea } from "@/components/atoms/textarea";
import { usePluginDialogStore } from "@/plugins/stores/pluginDialogStore";
import type { PromptField } from "@tps/plugin-sdk";

// ---------------------------------------------------------------------------
// Sub-componente: ConfirmDialogContent
// ---------------------------------------------------------------------------

interface ConfirmDialogContentProps {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialogContent({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogContentProps) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
        {message && <AlertDialogDescription>{message}</AlertDialogDescription>}
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className={
            destructive
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : undefined
          }
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente: PromptField renderer
// ---------------------------------------------------------------------------

interface FieldRendererProps {
  field: PromptField;
  value: string;
  onChange: (id: string, value: string) => void;
  onEnter: () => void;
  isLast: boolean;
}

function FieldRenderer({ field, value, onChange, onEnter, isLast }: FieldRendererProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isLast && field.type !== "textarea") {
      e.preventDefault();
      onEnter();
    }
  };

  const commonProps = {
    id: field.id,
    value,
    placeholder: field.placeholder,
    required: field.required,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(field.id, e.target.value),
    onKeyDown: handleKeyDown,
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-medium leading-none">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.type === "textarea" ? (
        <Textarea
          {...commonProps}
          onChange={(e) => onChange(field.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey && isLast) {
              e.preventDefault();
              onEnter();
            }
          }}
          rows={3}
        />
      ) : (
        <Input
          {...commonProps}
          type={field.type ?? "text"}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente: PromptDialogContent
// ---------------------------------------------------------------------------

interface PromptDialogContentProps {
  title: string;
  description?: string;
  fields: PromptField[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (values: Record<string, string>) => void;
  onCancel: () => void;
}

function PromptDialogContent({
  title,
  description,
  fields,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: PromptDialogContentProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.id] = field.defaultValue ?? "";
    }
    return initial;
  });

  // Ref para foco automático en el primer campo al abrir
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Timeout pequeño para que Radix termine la animación antes de hacer focus
    const id = setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, []);

  const handleFieldChange = useCallback((id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleConfirm = useCallback(() => {
    // Validar campos requeridos
    const allRequiredFilled = fields
      .filter((f) => f.required)
      .every((f) => (values[f.id] ?? "").trim() !== "");

    if (!allRequiredFilled) return;
    onConfirm(values);
  }, [fields, values, onConfirm]);

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      <div className="flex flex-col gap-4 py-2">
        {fields.map((field, index) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={values[field.id] ?? ""}
            onChange={handleFieldChange}
            onEnter={handleConfirm}
            isLast={index === fields.length - 1}
          />
        ))}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button onClick={handleConfirm}>{confirmLabel}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ---------------------------------------------------------------------------
// Componente principal: PluginDialogHost
// ---------------------------------------------------------------------------

/**
 * Host singleton para diálogos del sistema de plugins.
 * Montar una sola vez en main.tsx junto al <Toaster/>.
 *
 * @example
 * // En main.tsx, dentro de <TooltipProvider>:
 * <Toaster />
 * <PluginDialogHost />
 */
export function PluginDialogHost() {
  const activeRequest = usePluginDialogStore((s) => s.activeRequest);
  const resolveDialog = usePluginDialogStore((s) => s.resolveDialog);

  const isOpen = activeRequest !== null;

  // ── Handlers de confirm ───────────────────────────────────────────────────

  const handleConfirmAccept = useCallback(() => {
    resolveDialog(true);
  }, [resolveDialog]);

  const handleConfirmCancel = useCallback(() => {
    resolveDialog(false);
  }, [resolveDialog]);

  // ── Handlers de prompt ────────────────────────────────────────────────────

  const handlePromptConfirm = useCallback(
    (values: Record<string, string>) => {
      resolveDialog(values);
    },
    [resolveDialog]
  );

  const handlePromptCancel = useCallback(() => {
    resolveDialog(null);
  }, [resolveDialog]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (activeRequest?.type === "confirm") {
    const opts = activeRequest.options;
    return (
      <AlertDialog open={isOpen}>
        <ConfirmDialogContent
          title={opts.title}
          message={opts.message}
          confirmLabel={opts.confirmLabel ?? "Confirmar"}
          cancelLabel={opts.cancelLabel ?? "Cancelar"}
          destructive={opts.destructive ?? false}
          onConfirm={handleConfirmAccept}
          onCancel={handleConfirmCancel}
        />
      </AlertDialog>
    );
  }

  if (activeRequest?.type === "prompt") {
    const opts = activeRequest.options;
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          // Escape / click-outside → cancelar
          if (!open) handlePromptCancel();
        }}
      >
        <PromptDialogContent
          title={opts.title}
          description={opts.description}
          fields={opts.fields}
          confirmLabel={opts.confirmLabel ?? "Aceptar"}
          cancelLabel={opts.cancelLabel ?? "Cancelar"}
          onConfirm={handlePromptConfirm}
          onCancel={handlePromptCancel}
        />
      </Dialog>
    );
  }

  // Sin diálogo activo — no renderiza nada
  return null;
}
