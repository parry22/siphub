"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useCallback } from "react"
import { exportToExcel } from "@/lib/utils"

export function Navbar() {
  // Function to handle download
  const handleDownload = useCallback(async () => {
    try {
      // Fetch SIPs data
      const response = await fetch('/api/sips');
      if (!response.ok) {
        throw new Error('Failed to fetch SIPs');
      }
      const sips = await response.json();
      
      // Generate Excel data
      const excelData = exportToExcel(sips);
      
      // Create and trigger download
      const link = document.createElement("a");
      link.href = excelData;
      link.download = "sips-data.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading SIPs data:", error);
    }
  }, []);

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
          <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download SIPs</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
