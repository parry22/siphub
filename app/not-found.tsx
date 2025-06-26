import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <FileQuestion className="h-20 w-20 text-muted-foreground" />
      <h1 className="text-4xl font-bold">SIP Not Found</h1>
      <p className="text-xl text-muted-foreground">The Sui Improvement Proposal you're looking for doesn't exist.</p>
      <Link href="/">
        <Button>Return to Sui Digest</Button>
      </Link>
    </div>
  )
}
