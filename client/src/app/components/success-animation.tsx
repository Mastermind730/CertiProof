"use client"

import { CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface SuccessAnimationProps {
  show: boolean
  message?: string
}

export function SuccessAnimation({ show, message = "Success!" }: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => setIsVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-card/95 backdrop-blur-sm border rounded-lg p-6 shadow-lg animate-scale-in">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center animate-pulse-glow">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">{message}</h3>
            <p className="text-sm text-muted-foreground">Operation completed successfully</p>
          </div>
        </div>
      </div>
    </div>
  )
}
