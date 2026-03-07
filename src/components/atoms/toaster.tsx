import { Toaster as Sonner } from "sonner";
import { Info, CheckCircle, AlertTriangle, AlertCircle, X } from "lucide-react";

// Icono idéntico a tu ToastIcon original
const Icon = ({
  variant,
}: {
  variant: "info" | "success" | "warning" | "error";
}) => {
  const icons = {
    success: <CheckCircle className="size-6" />,
    warning: <AlertTriangle className="size-6" />,
    error: <AlertCircle className="size-6" />,
    info: <Info className="size-6" />,
  };
  const styles = {
    success:
      "bg-toast-success-icon-bg text-toast-success-icon border-toast-success-border",
    warning:
      "bg-toast-warning-icon-bg text-toast-warning-icon border-toast-warning-border",
    error:
      "bg-toast-error-icon-bg text-toast-error-icon border-toast-error-border",
    info: "bg-toast-info-icon-bg text-toast-info-icon border-toast-info-border",
  };
  return (
    <span
      className={`flex-shrink-0 flex items-center justify-center size-10 rounded-lg border ${styles[variant]}`}
    >
      {icons[variant]}
    </span>
  );
};

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      visibleToasts={3}
      expand={false}
      closeButton
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            "group/toast pointer-events-auto relative flex w-sm items-center",
            "gap-3 overflow-hidden rounded-md border p-3 pr-8 shadow-lg transition-all",
          ].join(" "),
          default: "border bg-background text-foreground",
          success:
            "border-toast-success-border text-toast-success-foreground [background:var(--toast-bg-success)]",
          error:
            "border-toast-error-border text-toast-error-foreground [background:var(--toast-bg-error)]",
          warning:
            "border-toast-warning-border text-toast-warning-foreground [background:var(--toast-bg-warning)]",
          info: "border-toast-info-border text-toast-info-foreground [background:var(--toast-bg-info)]",
          title: "text-sm font-semibold",
          description: "text-xs opacity-90 mt-0.5",
          closeButton: [
            "absolute right-2 top-2 rounded-md p-1 text-foreground/50",
            "opacity-0 transition-opacity hover:text-foreground",
            "focus:opacity-100 focus:outline-none focus:ring-2",
            "group-hover/toast:opacity-100",
          ].join(" "),
        },
      }}
      icons={{
        success: <Icon variant="success" />,
        error: <Icon variant="error" />,
        warning: <Icon variant="warning" />,
        info: <Icon variant="info" />,
        close: <X className="h-4 w-4" />,
      }}
    />
  );
}

// import { useToast } from "@/hooks/use-toast"
// import {
//   ToastClose,
//   ToastDescription,
//   ToastProvider,
//   ToastTitle,
//   ToastViewport,
//   ToastWithIcon,
// } from "@/components/atoms/toast"

// export function Toaster() {
//   const { toasts } = useToast()

//   return (
//     <ToastProvider>
//       {toasts.map(function ({ id, title, description, action, ...props }) {
//         return (
//           <ToastWithIcon key={id} {...props}>
//             <div className="flex flex-col">
//               {title && <ToastTitle>{title}</ToastTitle>}
//               {description && (
//                 <ToastDescription>{description}</ToastDescription>
//               )}
//             </div>
//             {action}
//             <ToastClose />
//           </ToastWithIcon>
//         )
//       })}
//       <ToastViewport />
//     </ToastProvider>
//   )
// }
