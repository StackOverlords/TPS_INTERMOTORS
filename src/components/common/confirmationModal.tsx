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
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import { Badge } from "../atoms/badge";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  alertMessage?: string;
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: XCircle,
    alertBg: "bg-destructive/10 border-destructive/20",
    confirmButton: "bg-destructive hover:bg-destructive/90 text-white",
    title: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    alertBg:
      "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/20",
    confirmButton:
      "bg-amber-500 hover:bg-amber-500/90 text-white dark:bg-amber-600 dark:hover:bg-amber-600/90",
    title: "text-amber-500 dark:text-amber-400",
  },
  info: {
    icon: Info,
    alertBg:
      "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/20",
    confirmButton:
      "bg-blue-600 hover:bg-blue-600/90 text-white dark:bg-blue-500 dark:hover:bg-blue-500/90",
    title: "text-blue-600 dark:text-blue-400",
  },
  success: {
    icon: CheckCircle,
    alertBg:
      "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/20",
    confirmButton:
      "bg-emerald-500 hover:bg-emerald-500/90 text-white dark:bg-emerald-600 dark:hover:bg-emerald-600/90",
    title: "text-emerald-500 dark:text-emerald-400",
  },
};

const alertDefaults = {
  danger: {
    title: "¿Estás seguro?",
    message: "Se requiere confirmación antes de continuar.",
    alertMessage: "Esta acción no se puede deshacer.",
  },
  success: {
    title: "Operación exitosa",
    message: "Todo salió bien, puedes continuar.",
    alertMessage: "Tu acción se completó correctamente.",
  },
  info: {
    title: "Información importante",
    message: "Revisa los detalles antes de proceder.",
    alertMessage: "Ten en cuenta esta información.",
  },
  warning: {
    title: "Advertencia",
    message: "Por favor revisa esta acción con cuidado.",
    alertMessage: "Podría tener consecuencias no deseadas.",
  },
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  alertMessage,
  isLoading = false,
}) => {
  const config = variantConfig[variant];
  const configDefaults = alertDefaults[variant];
  const IconComponent = config.icon;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle
            className={cn(
              "flex items-center justify-center gap-2",
              config.title
            )}
          >
            {title ?? configDefaults.title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild className="text-muted-foreground">
            <div className="flex flex-col space-y-3 py-2 items-center justify-center w-full">
              <span className="font-medium text-center">
                {message ?? configDefaults.message}
              </span>
              <Badge
                variant={variant}
                className={cn(
                  "fle items-center gap-3 p-1.5 rounded-md border w-full justify-center pointer-events-none",
                  config.alertBg
                )}
              >
                <IconComponent className="size-4 flex-shrink-0" />
                {alertMessage ?? configDefaults.alertMessage}
              </Badge>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 flex sm:justify-center items-center">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="border-border h-8 cursor-pointer"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={cn("h-8 cursor-pointer", config.confirmButton)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>{confirmText}</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
