"use client"

import type React from "react"

import { Input } from "@/app/components/ui/input"
import { cn } from "@/lib/utils"
import { forwardRef, useState } from "react"

interface EnhancedInputProps extends React.ComponentProps<typeof Input> {
  glow?: boolean
}

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, glow = false, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    return (
      <Input
        ref={ref}
        className={cn(
          "transition-all duration-300",
          glow && isFocused && "ring-2 ring-primary/20 border-primary/50",
          "hover:border-primary/30",
          className,
        )}
        onFocus={(e) => {
          setIsFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          onBlur?.(e)
        }}
        {...props}
      />
    )
  },
)

EnhancedInput.displayName = "EnhancedInput"
