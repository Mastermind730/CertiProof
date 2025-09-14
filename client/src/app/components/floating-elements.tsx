"use client"

import { useEffect, useState } from "react"

export function FloatingElements() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-20 left-[10%] w-2 h-2 bg-primary/20 rounded-full animate-float" />
      <div
        className="absolute top-40 right-[15%] w-3 h-3 bg-accent/30 rounded-full animate-float"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-32 left-[20%] w-1 h-1 bg-primary/40 rounded-full animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-20 right-[25%] w-2 h-2 bg-accent/20 rounded-full animate-float"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute top-1/2 left-[5%] w-1 h-1 bg-primary/30 rounded-full animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute top-1/3 right-[8%] w-2 h-2 bg-accent/25 rounded-full animate-float"
        style={{ animationDelay: "2.5s" }}
      />
    </div>
  )
}
