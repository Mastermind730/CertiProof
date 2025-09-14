"use client"

import type React from "react"

import { Card } from "@/app/components/ui/card"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface EnhancedCardProps extends React.ComponentProps<typeof Card> {
  hover?: boolean
  glow?: boolean
}

export const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, hover = true, glow = false, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "transition-all duration-300",
          hover && "hover-lift hover:border-primary/50",
          glow && "hover-glow",
          "group",
          className,
        )}
        {...props}
      >
        {children}
      </Card>
    )
  },
)

EnhancedCard.displayName = "EnhancedCard"
