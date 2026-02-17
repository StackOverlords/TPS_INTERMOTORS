import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-3 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
        // Nuevas variantes agregadas
        info: "border-toast-info-border text-toast-info-foreground",
        success: "border-toast-success-border text-toast-success-foreground",
        warning: "border-toast-warning-border text-toast-warning-foreground",
        error: "border-toast-error-border text-toast-error-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, style, ...props }, ref) => {
  const getBackgroundStyle = () => {
    // Detectar si estamos en dark mode
    const isDark = document.documentElement.classList.contains("dark");

    if (isDark) {
      // Gradientes para dark mode
      switch (variant) {
        case "info":
          return {
            background:
              "radial-gradient(ellipse at left, hsl(214 25% 20%) 0%, hsl(214 20% 18%) 50%, hsl(220 13% 16%) 100%)",
          };
        case "success":
          return {
            background:
              "radial-gradient(ellipse at left, hsl(142 25% 20%) 0%, hsl(142 20% 18%) 50%, hsl(220 13% 16%) 100%)",
          };
        case "warning":
          return {
            background:
              "radial-gradient(ellipse at left, hsl(38 25% 20%) 0%, hsl(38 20% 18%) 50%, hsl(220 13% 16%) 100%)",
          };
        case "error":
          return {
            background:
              "radial-gradient(ellipse at left, hsl(0 25% 20%) 0%, hsl(0 20% 18%) 50%, hsl(220 13% 16%) 100%)",
          };
        default:
          return {};
      }
    } else {
      // Gradientes para light mode (originales)
      switch (variant) {
        case "info":
          return {
            background:
              "radial-gradient(ellipse at left, hsl(214 100% 97%) 0%, hsl(214 55% 98%) 50%, hsl(0 0% 100%) 100%)",
          };
        case "success":
          return {
            background:
              "radial-gradient(ellipse at left, hsl(142 70% 92%) 0%, hsl(142 40% 96%) 50%, hsl(0 0% 100%) 100%)",
          };
        case "warning":
          return {
            background:
              "radial-gradient(ellipse at left, hsl(48 100% 95%) 0%, hsl(48 50% 97%) 50%, hsl(0 0% 100%) 100%)",
          };
        case "error":
          return {
            background:
              "radial-gradient(ellipse at left, hsl(0 100% 97%) 0%, hsl(0 50% 98%) 50%, hsl(0 0% 100%) 100%)",
          };
        default:
          return {};
      }
    }
  };

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      style={{ ...getBackgroundStyle(), ...style }}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// Nuevo componente para el icono del toast
const ToastIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: VariantProps<typeof toastVariants>["variant"];
  }
>(({ className, variant, ...props }, ref) => {
  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="size-6" />;
      case "warning":
        return <AlertTriangle className="size-6" />;
      case "error":
        return <AlertCircle className="size-6" />;
      case "info":
        return <Info className="size-6" />;
      default:
        return <Info className="size-6" />;
    }
  };

  const getStyles = () => {
    switch (variant) {
      case "success":
        return "bg-toast-success-icon-bg text-toast-success-icon border border-toast-success-border";
      case "warning":
        return "bg-toast-warning-icon-bg text-toast-warning-icon border border-toast-warning-border";
      case "error":
        return "bg-toast-error-icon-bg text-toast-error-icon border border-toast-error-border";
      case "info":
        return "bg-toast-info-icon-bg text-toast-info-icon border border-toast-info-border";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex-shrink-0 flex items-center justify-center size-10 rounded-lg relative",
        getStyles(),
        className
      )}
      {...props}
    >
      {/* <div className="bg-green-200 rounded-full size-20 absolute"></div> */}
      {getIcon()}
    </div>
  );
});
ToastIcon.displayName = "ToastIcon";

// Componente wrapper para toast con icono
const ToastWithIcon = React.forwardRef<
  React.ElementRef<typeof Toast>,
  React.ComponentPropsWithoutRef<typeof Toast> & {
    showIcon?: boolean;
  }
>(({ children, variant, showIcon = true, className, ...props }, ref) => (
  <Toast ref={ref} variant={variant} className={className} {...props}>
    {showIcon && <ToastIcon variant={variant} />}
    <div className="flex-1 min-w-0">{children}</div>
    <ToastClose />
  </Toast>
));
ToastWithIcon.displayName = "ToastWithIcon";

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastWithIcon,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
};
