"use client"

import { ReactNode, useState } from "react"
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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
 * The modal embeds a Gumlet player with the parameters requested by the user.
 */
export function VideoModal({
  trigger,
  buttonText = "Watch Video",
  buttonVariant = "secondary",
  buttonSize = "default",
  className,
}: VideoModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          // Custom trigger passed by the parent component
          trigger
        ) : (
          // Fallback trigger – regular UI button
          <Button
            variant={buttonVariant}
            size={buttonSize}
            className={className}
            aria-label="Watch video about SIPs"
          >
            {buttonText}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[800px] p-0 bg-black border-gray-800 relative">
        {/* Close button */}
        <DialogClose
          className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 z-10"
          aria-label="Close video"
        >
          <X className="h-5 w-5" />
        </DialogClose>

        {/* Video embed */}
        <div style={{ position: "relative", aspectRatio: "9/16" }}>
          <iframe
            loading="lazy"
            title="Gumlet video player"
            src="https://play.gumlet.io/embed/685d511e946bf1574dd11312?preload=false&autoplay=false&loop=false&background=false&disable_player_controls=false"
            style={{
              border: "none",
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
            }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 