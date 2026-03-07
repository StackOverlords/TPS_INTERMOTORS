import { toast as sonnerToast } from "sonner";

export type ToastVariant = "info" | "success" | "warning" | "error";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

const variantMap = {
  success: sonnerToast.success,
  error: sonnerToast.error,
  warning: sonnerToast.warning,
  info: sonnerToast.info,
} as const;

const callToast = ({
  title,
  description,
  variant = "info",
  duration,
}: ToastOptions) => {
  const fn = variantMap[variant] ?? sonnerToast;
  return fn(title, { description, duration });
};

// Misma API que antes — ningún componente que los use necesita cambiar
export const showInfoToast = (options: Omit<ToastOptions, "variant">) =>
  callToast({ variant: "info", ...options });
export const showSuccessToast = (options: Omit<ToastOptions, "variant">) =>
  callToast({ variant: "success", ...options });
export const showWarningToast = (options: Omit<ToastOptions, "variant">) =>
  callToast({ variant: "warning", ...options });
export const showErrorToast = (options: Omit<ToastOptions, "variant">) =>
  callToast({ variant: "error", ...options });
export const showToast = (options: ToastOptions) => callToast(options);

// import { toast } from "@/hooks/use-toast"

// export type ToastVariant = "info" | "success" | "warning" | "error"

// interface ToastOptions {
//     title: string
//     description?: string
//     variant?: ToastVariant
//     duration?: number
// }

// export const showInfoToast = (options: Omit<ToastOptions, "variant">) => {
//     return toast({
//         variant: "info",
//         ...options,
//     })
// }

// export const showSuccessToast = (options: Omit<ToastOptions, "variant">) => {
//     return toast({
//         variant: "success",
//         ...options,
//     })
// }

// export const showWarningToast = (options: Omit<ToastOptions, "variant">) => {
//     return toast({
//         variant: "warning",
//         ...options,
//     })
// }

// export const showErrorToast = (options: Omit<ToastOptions, "variant">) => {
//     return toast({
//         variant: "error",
//         ...options,
//     })
// }

// export const showToast = (options: ToastOptions) => {
//     return toast(options)
// }
