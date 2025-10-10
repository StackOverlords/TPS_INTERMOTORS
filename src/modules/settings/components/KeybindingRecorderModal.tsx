import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { AlertCircle, CheckCircle2, Keyboard } from "lucide-react";
import { useEffect, useState } from "react";

interface KeybindingRecorderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (keys: string) => void;
  currentKeys: string;
  description: string;
  conflictsWith?: string[];
}

const KeybindingRecorderModal = ({
  open,
  onClose,
  onConfirm,
  currentKeys,
  description,
  conflictsWith = []
}: KeybindingRecorderModalProps) => {
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [tempKeys, setTempKeys] = useState<string>("");
  const [hasConflict, setHasConflict] = useState(false);

  useEffect(() => {
    if (!open) {
      setRecordedKeys([]);
      setTempKeys("");
      setHasConflict(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Si presiona Escape, cancelar
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Si presiona Enter, confirmar
      if (e.key === 'Enter' && tempKeys) {
        onConfirm(tempKeys);
        return;
      }

      const keys: string[] = [];

      // Capturar modificadores
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Meta');

      // Capturar tecla principal
      const key = e.key.toLowerCase();
      if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
        const specialKeys: Record<string, string> = {
          'arrowup': '↑',
          'arrowdown': '↓',
          'arrowleft': '←',
          'arrowright': '→',
          'escape': 'Escape',
          'enter': 'Enter',
          'tab': 'Tab',
          'backspace': 'Backspace',
          'delete': 'Delete',
          'home': 'Home',
          'end': 'End',
          'pageup': 'PageUp',
          'pagedown': 'PageDown',
          ' ': 'Space'
        };
        keys.push(specialKeys[key] || key.toUpperCase());
      }

      setRecordedKeys(keys);
      const keyCombination = keys.join('+');
      setTempKeys(keyCombination);

      // Verificar conflictos
      setHasConflict(conflictsWith.includes(keyCombination));
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, tempKeys, conflictsWith, onClose, onConfirm]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader className="space-y-1 pb-2">
          <DialogTitle className="text-sm font-medium">{description}</DialogTitle>
          <DialogDescription className="text-xs">
            {currentKeys && <span className="text-muted-foreground">Actual: <kbd className="px-1.5 py-0.5 bg-muted border border-gray-200 rounded text-xs font-mono">{currentKeys}</kbd></span>}
          </DialogDescription>
        </DialogHeader>

        <div className="py-1">
          <div className="min-h-[40px] flex items-center justify-center border border-dashed border-border rounded bg-muted/30 px-3 py-3">
            {tempKeys ? (
              <div className="flex items-center gap-1.5">
                {recordedKeys.map((key, index) => (
                  <span key={index} className="flex items-center">
                    <kbd className="px-2 py-1 text-xs font-mono bg-background border border-gray-200 rounded shadow-sm">
                      {key}
                    </kbd>
                    {index < recordedKeys.length - 1 && <span className="mx-1 text-muted-foreground text-sm">+</span>}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Keyboard className="w-4 h-4" />
                <span className="text-xs">Presiona una combinación...</span>
              </div>
            )}
          </div>

          {hasConflict && tempKeys && (
            <div className="flex items-center gap-1.5 text-destructive text-xs mt-2">
              <AlertCircle className="w-3 h-3" />
              <span>Ya está en uso</span>
            </div>
          )}

          {tempKeys && !hasConflict && (
            <div className="flex items-center gap-1.5 text-gray-600 text-xs mt-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Presiona Enter para confirmar</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 pt-2">
          <div className="text-[10px] text-muted-foreground flex-1">
            <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> cancelar · <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> confirmar
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={() => tempKeys && onConfirm(tempKeys)} disabled={!tempKeys || hasConflict} className="h-7 text-xs">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KeybindingRecorderModal;
