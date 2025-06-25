"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ExternalLink, GitPullRequest, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GitHubPR {
  id: number
  number: number
  title: string
  state: string
  merged_at: string | null
  created_at: string
  updated_at: string
  html_url: string
  user: {
    login: string
    avatar_url: string
  }
  labels: Array<{
    name: string
    color: string
  }>
  body?: string
}

export default function SipsPage() {
  const [sips, setSips] = useState<GitHubPR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSips = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/sips")

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch SIPs")
        }

        const data = await response.json()
        setSips(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch SIPs"
        setError(errorMessage)

        if (errorMessage.includes("rate limit")) {
          toast({
            title: "GitHub rate-limit hit",
            description: "Please try again later.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error fetching SIPs",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSips()
  }, [toast])

  const getStatusBadge = (pr: GitHubPR) => {
    if (pr.merged_at) {
      return <Badge className="bg-purple-500/20 text-purple-500 hover:bg-purple-500/20">MERGED</Badge>
    } else if (pr.state === "closed") {
      return <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/20">CLOSED</Badge>
    } else {
      return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/20">OPEN</Badge>
    }
  }
  
  const getDescriptionSnippet = (pr: GitHubPR): string => {
    // Manual overrides (keep in sync with detailed descriptions)
    const manualDescriptions: Record<number, string | undefined> = {
      58: `Add more tx_context. This proposal introduces two new functions to Sui's tx_context module—\`is_signed_by\` and \`signers\`—to enable multi-signer transaction checks.`,
      57: `UpgradedPackageEvent. Introduces an event emitted whenever a package is upgraded, improving observability for developers.`,
      56: `Attestation Registry. Proposes a permissionless system for issuing trust attestations on Sui smart contract packages.`,
      55: `Infallible PTBs. Allows partial success and fallback paths in programmable transaction blocks, improving reliability.`,
      54: `One-Click Trading. Adds auto-signing functionality to the Sui Wallet Standard for smoother user experience.`,
      53: `Singleton Ability. Guarantees uniqueness of certain objects in Move, enhancing security and simplicity.`,
      52: `destroy_zero Function. Adds safe deletion methods for zero-balance TreasuryCap and Supply objects to save storage.`,
    }

    const manual = manualDescriptions[pr.number]
    const text = manual || pr.body || ""
    // Extract first 20 words
    return text.split(/\s+/).slice(0, 20).join(" ") + (text.split(/\s+/).length > 20 ? "…" : "")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Sui Improvement Proposals</h1>
          <p className="text-muted-foreground">Loading SIPs from the sui-foundation/sips repository...</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Sui Improvement Proposals</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error loading SIPs: {error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sui Improvement Proposals</h1>
        <p className="text-muted-foreground">SIPs from the sui-foundation/sips repository ({sips.length} found)</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sips.map((sip) => (
          <Link key={sip.id} href={`/sips/${sip.number}`}>
            <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  {getStatusBadge(sip)}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <GitPullRequest className="h-4 w-4" />#{sip.number}
                  </div>
                </div>
                <CardTitle className="line-clamp-2 text-lg leading-tight">{sip.title}</CardTitle>
                <CardDescription className="text-xs">
                  Created: {formatDate(sip.created_at)}
                  {sip.updated_at !== sip.created_at && ` • Updated: ${formatDate(sip.updated_at)}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <img
                    src={sip.user.avatar_url || "/placeholder.svg"}
                    alt={sip.user.login}
                    className="h-5 w-5 rounded-full"
                  />
                  <span>by {sip.user.login}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3 mb-3">{getDescriptionSnippet(sip)}</p>
                <div className="flex flex-wrap gap-1">
                  {sip.labels.slice(0, 3).map((label) => (
                    <Badge
                      key={label.name}
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: `#${label.color}`, color: `#${label.color}` }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                  {sip.labels.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{sip.labels.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(sip.html_url, "_blank", "noopener,noreferrer")
                    }}
                    className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    GitHub
                  </button>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {sips.length === 0 && !loading && (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No SIPs found in the repository</p>
        </div>
      )}
    </div>
  )
}
