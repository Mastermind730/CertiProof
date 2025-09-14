"use client"

import type React from "react"

import { Button } from "@/app/components/ui/button"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface EnhancedButtonProps extends React.ComponentProps<typeof Button> {
  ripple?: boolean
  glow?: boolean
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, ripple = true, glow = false, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          "hover:scale-105 active:scale-95",
          glow && "hover:shadow-lg hover:shadow-primary/25",
          ripple &&
            "before:absolute before:inset-0 before:bg-white/20 before:scale-0 before:rounded-full before:transition-transform before:duration-300 hover:before:scale-100",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    )
  },
)

EnhancedButton.displayName = "EnhancedButton"
