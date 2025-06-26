import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-muted/50",
  {
    variants: {
      variant: {
        default:
          "bg-muted text-white hover:bg-muted/80",
        primary:
          "bg-accent-mint text-black font-bold shadow-glow hover:scale-105 active:scale-95",
        destructive:
          "bg-destructive text-white shadow-soft hover:bg-destructive/90",
        outline:
          "border border-muted bg-muted text-white hover:bg-muted/80",
        secondary:
          "bg-muted text-white hover:bg-muted/80",
        ghost:
          "hover:bg-muted/50 text-white",
        link: "text-accent-mint underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-8 rounded-lg px-3 py-2 text-xs",
        lg: "h-14 rounded-xl px-8 py-4 text-lg font-bold",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
