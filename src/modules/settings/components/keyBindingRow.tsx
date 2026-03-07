import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import { Edit2, RotateCcw } from "lucide-react";
import { useState } from "react";
import KeybindingRecorderModal from "./KeybindingRecorderModal";

// Formatea las teclas para display
const formatKeys = (keys: string): string => {
  return keys
    .split("+")
    .map((k) => {
      const lower = k.toLowerCase();
      if (lower === "ctrl") return "Ctrl";
      if (lower === "alt") return "Alt";
      if (lower === "shift") return "Shift";
      if (lower === "meta") return "Meta";
      if (lower === "escape") return "Esc";
      if (lower === "enter") return "Enter";
      if (lower === "tab") return "Tab";
      if (lower === "backspace") return "Backspace";
      if (lower === "delete") return "Del";
      if (lower === "space") return "Space";
      if (lower === "arrowup" || lower === "up") return "↑";
      if (lower === "arrowdown" || lower === "down") return "↓";
      if (lower === "arrowleft" || lower === "left") return "←";
      if (lower === "arrowright" || lower === "right") return "→";
      if (lower === "home") return "Home";
      if (lower === "end") return "End";
      return k.toUpperCase();
    })
    .join("+");
};

const KeybindingRow = ({
  id,
  currentKeys,
  description,
  isCustom,
  hasConflict,
  conflictsWith = [],
  onEdit,
  onReset,
}: {
  id: string;
  currentKeys: string;
  description: string;
  isCustom: boolean;
  hasConflict: boolean;
  conflictsWith?: string[];
  onEdit: (id: string, keys: string) => void;
  onReset: (id: string) => void;
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleConfirm = (keys: string) => {
    onEdit(id, keys);
    setModalOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "group grid grid-cols-[2fr_1.5fr_200px_80px] gap-4 items-center px-3 py-1.5 hover:bg-accent/30 border-b border-border/30 transition-colors text-sm",
          hasConflict && "bg-destructive/10 dark:bg-destructive/20"
        )}
      >
        {/* Descripción/Acción */}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{description}</p>
        </div>

        {/* Comando/ID */}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-mono truncate">
            {id}
          </p>
        </div>

        {/* Keybinding */}
        <div className="flex items-center justify-end gap-1">
          <kbd
            className={cn(
              "px-1.5 py-0.5 text-xs font-mono bg-muted/40 border border-border/50 rounded select-none",
              hasConflict &&
                "border-destructive/60 text-destructive bg-destructive/15 dark:border-destructive/70 dark:bg-destructive/25"
            )}
          >
            {formatKeys(currentKeys)}
          </kbd>
        </div>

        {/* Acciones - Solo visible en hover */}
        <div className="flex items-center justify-end gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-6 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Editar"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          {isCustom && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReset(id)}
              className="h-6 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Restablecer a valor por defecto"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Modal para grabar teclas */}
      <KeybindingRecorderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        currentKeys={currentKeys}
        description={description}
        conflictsWith={conflictsWith}
      />
    </>
  );
};

export default KeybindingRow;
