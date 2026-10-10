import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { ReleaseNotesMarkdown } from "./ReleaseNotesMarkdown";

interface DialogAction {
  label: string;
  onClick: () => void;
}

interface VersionNotesDialogProps {
  open: boolean;
  /** Cerrar con Esc, la X o clic afuera. */
  onClose: () => void;
  title: string;
  description: string;
  notes: string;
  primary: DialogAction;
  secondary?: DialogAction;
}

/** Notas de una versión: antes de actualizar (desde el login) o después (una sola vez). */
export function VersionNotesDialog({
  open,
  onClose,
  title,
  description,
  notes,
  primary,
  secondary,
}: VersionNotesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <ReleaseNotesMarkdown source={notes} />
        </div>
        <DialogFooter className="border-t border-border px-6 py-3">
          {secondary && (
            <Button variant="ghost" onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          )}
          <Button onClick={primary.onClick}>{primary.label}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
