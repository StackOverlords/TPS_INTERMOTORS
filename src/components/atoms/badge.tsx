import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/40",
        info: "border-transparent bg-blue-100 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-500/40",
        warning:
          "border-transparent bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-500/40",
        danger:
          "border-transparent bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-100/80 dark:hover:bg-red-500/40",
        accent:
          "border-transparent bg-purple-100 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100/80 dark:hover:bg-purple-500/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
