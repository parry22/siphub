"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SearchPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main page since search is now integrated there
    router.push("/")
  }, [router])

  return (
    <div className="flex h-40 flex-col items-center justify-center">
      <p className="text-muted-foreground">Redirecting to main page...</p>
    </div>
  )
}
