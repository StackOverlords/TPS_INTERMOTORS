import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface SelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Texto accesible para lectores de pantalla. No se muestra. */
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor DIÁLOGO para los selectores.
 *
 * Es el gemelo de las ventanas secundarias: monta el mismo componente de
 * selección dentro de la página en vez de en una ventana del SO.
 *
 * Cuándo usar cuál:
 *  - **Ventana** (escritorio): el usuario puede dejar el selector abierto en un
 *    segundo monitor mientras trabaja en la principal.
 *  - **Diálogo** (web): en el navegador un popup arrastra el bundle entero de
 *    nuevo en cada apertura, lo bloquean los bloqueadores de emergentes y no
 *    existe en tablets.
 *
 * Ocupa casi todo el viewport a propósito: los selectores muestran tablas con
 * miles de filas y un modal chico los vuelve inusables.
 */
export const SelectorDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: SelectorDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={cn(
        "max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 flex flex-col",
        className,
      )}
    >
      <DialogHeader className="px-4 py-3 border-b border-border">
        <DialogTitle>{title}</DialogTitle>
        {/* Radix pide una descripción para accesibilidad aunque no se vea. */}
        <DialogDescription className="sr-only">
          {description ?? title}
        </DialogDescription>
      </DialogHeader>

      {/* `min-h-0` es lo que permite que la tabla scrollee adentro en vez de
          desbordar el diálogo. */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </DialogContent>
  </Dialog>
);

export default SelectorDialog;
