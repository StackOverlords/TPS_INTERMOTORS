import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Label } from "@/components/atoms/label";
import { RadioGroup, RadioGroupItem } from "@/components/atoms/radio-group";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { Separator } from "@/components/atoms/separator";
import type {
  ImportMode,
  ImportValidationResult,
} from "@/database/schemas/keybindings.schema";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, FileJson } from "lucide-react";
import { useState } from "react";

interface ImportKeybindingsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: ImportMode) => void;
  validation: ImportValidationResult | null;
  fileName?: string;
}

const ImportKeybindingsModal = ({
  open,
  onClose,
  onConfirm,
  validation,
  fileName,
}: ImportKeybindingsModalProps) => {
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importing, setImporting] = useState(false);

  if (!validation) return null;

  const handleConfirm = async () => {
    setImporting(true);
    try {
      await onConfirm(importMode);
    } finally {
      setImporting(false);
    }
  };

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;
  const hasConflicts = validation.conflicts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Vista Previa de Importación
          </DialogTitle>
          <DialogDescription>
            {fileName && <span className="text-xs font-mono">{fileName}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Estado de validación */}
          <div className="space-y-2">
            {hasErrors && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 dark:bg-destructive/20 border border-destructive/40 dark:border-destructive/50 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-destructive">
                    Errores encontrados ({validation.errors.length})
                  </p>
                  <ul className="mt-1 space-y-1">
                    {validation.errors.map((error, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!hasErrors && hasWarnings && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 dark:bg-yellow-500/20 border border-yellow-500/30 dark:border-yellow-500/40 rounded-md">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-yellow-700 dark:text-yellow-500">
                    Advertencias ({validation.warnings.length})
                  </p>
                  <ul className="mt-1 space-y-1">
                    {validation.warnings.slice(0, 3).map((warning, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        • {warning}
                      </li>
                    ))}
                    {validation.warnings.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        • ... y {validation.warnings.length - 3} advertencias más
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {!hasErrors && !hasWarnings && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 dark:border-green-500/40 rounded-md">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
                <p className="text-sm font-medium text-green-700 dark:text-green-500">
                  Archivo válido y listo para importar
                </p>
              </div>
            )}
          </div>

          {/* Resumen */}
          {/* <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-md bg-muted/30">
              <p className="text-2xl font-bold">{validation.summary.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-3 rounded-md bg-blue-500/5">
              <p className="text-2xl font-bold text-blue-600">
                {validation.summary.new}
              </p>
              <p className="text-xs text-muted-foreground">Nuevos</p>
            </div>
            <div className="p-3 rounded-md bg-orange-500/5">
              <p className="text-2xl font-bold text-orange-600">
                {validation.summary.modified}
              </p>
              <p className="text-xs text-muted-foreground">Modificados</p>
            </div>
            <div className="p-3 rounded-md bg-muted/30">
              <p className="text-2xl font-bold text-muted-foreground">
                {validation.summary.unchanged}
              </p>
              <p className="text-xs text-muted-foreground">Sin cambios</p>
            </div>
          </div> */}

          {/* Conflictos */}
          {hasConflicts && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <h4 className="text-sm font-medium mb-2">
                Conflictos detectados ({validation.conflicts.length})
              </h4>
              <ScrollArea className="flex-1 border rounded-md">
                <div className="p-2 space-y-2">
                  {validation.conflicts.map((conflict, i) => (
                    <div
                      key={i}
                      className="p-2 bg-muted/30 rounded-md text-xs space-y-1"
                    >
                      <p className="font-medium">{conflict.description}</p>
                      <p className="text-muted-foreground font-mono">
                        {conflict.id}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <kbd className="px-1.5 py-0.5 bg-destructive/15 dark:bg-destructive/25 border border-destructive/50 dark:border-destructive/60 rounded text-[10px]">
                          {conflict.existingKeys}
                        </kbd>
                        <span className="text-muted-foreground">→</span>
                        <kbd className="px-1.5 py-0.5 bg-primary/15 dark:bg-primary/25 border border-primary/40 dark:border-primary/50 rounded text-[10px]">
                          {conflict.importedKeys}
                        </kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Opciones de importación */}
          {!hasErrors && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Modo de importación</h4>
                <RadioGroup
                  value={importMode}
                  onValueChange={(value) => setImportMode(value as ImportMode)}
                  className="space-y-2"
                >
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="merge" id="merge" className="mt-0.5" />
                    <div className="flex-1">
                      <Label
                        htmlFor="merge"
                        className={cn(
                          "text-sm font-medium cursor-pointer",
                          importMode === 'merge' && "text-primary"
                        )}
                      >
                        Combinar (recomendado)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Actualiza los atajos existentes y agrega nuevos. Mantiene los
                        que no están en el archivo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem
                      value="replace"
                      id="replace"
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="replace"
                        className={cn(
                          "text-sm font-medium cursor-pointer",
                          importMode === 'replace' && "text-primary"
                        )}
                      >
                        Reemplazar todo
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Elimina todos los atajos personalizados y aplica solo los del
                        archivo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem
                      value="add-only"
                      id="add-only"
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="add-only"
                        className={cn(
                          "text-sm font-medium cursor-pointer",
                          importMode === 'add-only' && "text-primary"
                        )}
                      >
                        Solo agregar nuevos
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Agrega solo los atajos que no existen. No modifica los
                        existentes.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={importing}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={hasErrors || importing}
            className="min-w-24"
          >
            {importing ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportKeybindingsModal;
