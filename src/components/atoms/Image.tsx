import * as React from "react"
import { cn } from "@/lib/utils"

interface ImageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: "rounded" | "square" | "circle"
  loading?: "eager" | "lazy"
}

const ImageContainer = React.forwardRef<HTMLDivElement, ImageContainerProps>(
  ({ className, shape = "square", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden",
        {
          "rounded-none": shape === "square",
          "rounded-md": shape === "rounded",
          "rounded-full": shape === "circle",
        },
        className
      )}
      {...props}
    />
  )
)
ImageContainer.displayName = "ImageContainer"

interface ImageContentProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode
}

const ImageContent = React.forwardRef<HTMLImageElement, ImageContentProps>(
  ({ className, src, alt, fallback, ...props }, ref) => {
    const [error, setError] = React.useState(false)

    if (error || !src) {
      return (
        <div className={cn(
          "flex h-full w-full items-center justify-center bg-muted",
          className
        )}>
          {fallback || (
            <svg
              className="h-2/3 w-2/3 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
      )
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn("object-cover h-full w-full", className)}
        onError={() => setError(true)}
        {...props}
      />
    )
  }
)
ImageContent.displayName = "ImageContent"

interface SvgContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

const SvgContainer = React.forwardRef<HTMLDivElement, SvgContainerProps>(
  ({ className, size = "md", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center",
        {
          "h-6 w-6": size === "sm",
          "h-8 w-8": size === "md",
          "h-10 w-10": size === "lg",
          "h-12 w-12": size === "xl",
          "h-full w-full": size === "full",
        },
        className
      )}
      {...props}
    />
  )
)
SvgContainer.displayName = "SvgContainer"

export { ImageContainer, ImageContent, SvgContainer }