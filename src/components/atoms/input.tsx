import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  autoSelectOnFocus?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, autoSelectOnFocus = false, onFocus, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm no-spinners",
          className
        )}
        ref={ref}
        onFocus={(e) => {
          if (autoSelectOnFocus) {
            setTimeout(() => {
              e.target.select()
            }, 0)
          }
          onFocus?.(e) // por si el usuario pasa otro handler
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
