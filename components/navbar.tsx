import Link from "next/link"

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
          {/* ModeToggle removed */}
        </div>
      </div>
    </header>
  )
}
