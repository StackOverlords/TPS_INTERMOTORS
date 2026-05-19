/**
 * Modal para adjuntar una referencia a entidad de negocio a un mensaje.
 * El usuario escribe el ID del documento y selecciona el tipo.
 *
 * Uso:
 *   <ReferencePickerModal
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     onSelect={(tipo, id) => setReference({ tipo, id })}
 *   />
 *
 * ⚠️  MEJORA FUTURA: En lugar de ingresar el ID manualmente, cada tipo
 *     podría abrir un buscador real (ej: buscar venta por cliente/fecha).
 *     Por ahora el usuario ingresa el ID directamente — es suficiente
 *     para el flujo operativo actual.
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import { ShoppingCart, Package, ArrowRightLeft, Link } from "lucide-react";
import type { ReferenciaTipo } from "../types/Message.types";

// ─────────────────────────────────────────────────────────────────────────────
// ENTITY TYPES CONFIG
// ─────────────────────────────────────────────────────────────────────────────

interface EntityType {
  tipo: ReferenciaTipo;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  color: string;
}

const ENTITY_TYPES: EntityType[] = [
  {
    tipo: "sale",
    label: "Venta",
    icon: <ShoppingCart className="h-4 w-4" />,
    placeholder: "Ej: 1042",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  {
    tipo: "purchase",
    label: "Compra",
    icon: <Package className="h-4 w-4" />,
    placeholder: "Ej: 238",
    color: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  },
  {
    tipo: "transfer",
    label: "Transferencia",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    placeholder: "Ej: 55",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  {
    tipo: "almacen_out",
    label: "Salida almacén",
    icon: <Package className="h-4 w-4" />,
    placeholder: "Ej: 301",
    color: "bg-red-500/10 text-red-600 border-red-500/30",
  },
  {
    tipo: "almacen_in",
    label: "Entrada almacén",
    icon: <Package className="h-4 w-4" />,
    placeholder: "Ej: 145",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (tipo: ReferenciaTipo, id: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function ReferencePickerModal({ open, onClose, onSelect }: Props) {
  const [selectedTipo, setSelectedTipo] = useState<ReferenciaTipo | null>(null);
  const [idValue, setIdValue] = useState("");

  const selectedEntity = ENTITY_TYPES.find((e) => e.tipo === selectedTipo);
  const idNumber = parseInt(idValue, 10);
  const isValid = selectedTipo !== null && !isNaN(idNumber) && idNumber > 0;

  const handleConfirm = () => {
    if (!isValid || !selectedTipo) return;
    onSelect(selectedTipo, idNumber);
    handleClose();
  };

  const handleClose = () => {
    setSelectedTipo(null);
    setIdValue("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="px-4 pb-3 pt-4">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Link className="h-4 w-4 text-primary" />
            Vincular documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-4 pb-4">
          {/* Selector de tipo */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de documento
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {ENTITY_TYPES.map((entity) => (
                <button
                  key={entity.tipo}
                  onClick={() => setSelectedTipo(entity.tipo)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[12px] font-medium transition-all",
                    selectedTipo === entity.tipo
                      ? entity.color + " border-current"
                      : "border-border/50 text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  {entity.icon}
                  {entity.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input de ID — aparece al seleccionar tipo */}
          {selectedTipo && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nro. de {selectedEntity?.label}
              </p>
              <Input
                autoFocus
                type="number"
                min={1}
                placeholder={selectedEntity?.placeholder}
                value={idValue}
                onChange={(e) => setIdValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                className="h-9 text-sm"
              />
            </div>
          )}

          {/* Preview */}
          {isValid && selectedEntity && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2",
                selectedEntity.color
              )}
            >
              {selectedEntity.icon}
              <span className="text-[12px] font-semibold">
                {selectedEntity.label} #{idNumber}
              </span>
              <span className="ml-auto text-[10px] opacity-60">
                Vista previa
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              disabled={!isValid}
              onClick={handleConfirm}
            >
              Vincular
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
