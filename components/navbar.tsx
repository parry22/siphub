"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            {/* Using Bricolage Grotesque font for the logo */}
            <span className="text-xl italic font-semibold" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
              SIPs Hub
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="flex items-center gap-2">
            <Link href="https://github.com/sui-foundation/sips" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">Go to Github</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
