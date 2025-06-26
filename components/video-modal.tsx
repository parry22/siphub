"use client"

import { ReactNode, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

// Add type declaration for Wistia
declare global {
  interface Window {
    _wq: any[]
  }
}

interface VideoModalProps {
  /** Text for the fallback button trigger (if no custom trigger element is provided) */
  buttonText?: string
  /** Variant for the fallback button trigger */
  buttonVariant?: "default" | "outline" | "secondary" | "ghost"
  /** Size for the fallback button trigger */
  buttonSize?: "default" | "sm" | "lg"
  /** Additional className for the fallback button trigger */
  className?: string
  /** Optional custom trigger element (e.g. a LiquidButton) */
  trigger?: ReactNode
}

/**
 * Generic video modal component that can be triggered by any React element.
 *
 * - If a `trigger` prop is provided, it will be wrapped with `DialogTrigger` using `asChild`.
 * - Otherwise a default `<Button>` will be rendered.
 *
 * The modal embeds a Wistia player with popover functionality.
 */
export function VideoModal({
  trigger,
  buttonText = "Watch Video",
  buttonVariant = "secondary",
  buttonSize = "default",
  className,
}: VideoModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if scripts are already loaded
    if (!document.querySelector('script[src="https://fast.wistia.com/assets/external/E-v1.js"]')) {
      // Load Wistia main script
      const script1 = document.createElement('script')
      script1.src = "https://fast.wistia.com/assets/external/E-v1.js"
      script1.async = true
      document.head.appendChild(script1)
    }

    // Initialize Wistia
    if (window._wq === undefined) {
      window._wq = []
    }
    
    window._wq.push({ 
      id: '50wdp4uebb', 
      onReady: function(video) {
        console.log("Video ready")
      }
    })

    // No need to cleanup scripts as they might be used by other components
  }, [])

  return (
    <div ref={containerRef} className="inline-block">
      {/* Use Wistia's native popover functionality */}
      <span className="wistia_embed wistia_async_50wdp4uebb popover=true popoverContent=link">
        {trigger || (
          <Button
            variant={buttonVariant}
            size={buttonSize}
            className={className}
          >
            {buttonText}
          </Button>
        )}
      </span>
    </div>
  )
} 