"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface VideoModalProps {
  buttonText: string
  buttonVariant?: "default" | "outline" | "secondary"
  buttonSize?: "default" | "sm" | "lg"
  className?: string
}

export function VideoModal({ 
  buttonText, 
  buttonVariant = "secondary", 
  buttonSize = "default", 
  className 
}: VideoModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonSize} 
          className={className}
          aria-label="Watch video about SIPs"
        >
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] p-0 bg-black border-gray-800">
        <DialogClose className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 z-10" aria-label="Close video">
          <X className="h-5 w-5" />
        </DialogClose>
        <div style={{ position: "relative", aspectRatio: "16/9" }}>
          <iframe 
            loading="lazy" 
            title="What is a SIP? Video Explanation"
            src="https://play.gumlet.io/embed/685d511e946bf1574dd11312?preload=true&autoplay=true&loop=false&background=false&disable_player_controls=false"
            style={{ border: "none", position: "absolute", top: 0, left: 0, height: "100%", width: "100%" }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
            aria-label="Video explaining what SIPs are"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 