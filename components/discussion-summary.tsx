"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface DiscussionSummaryProps {
  sipId: string
  className?: string
  commentCount: number
}

export function DiscussionSummary({ sipId, className, commentCount }: DiscussionSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  console.log(`DiscussionSummary component rendered for SIP ${sipId} with ${commentCount} comments`)

  useEffect(() => {
    // Don't fetch if there are no comments
    if (commentCount === 0) {
      console.log(`SIP ${sipId} has no comments, not fetching summary`)
      setLoading(false)
      return
    }

    console.log(`Fetching discussion summary for SIP ${sipId}`)
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        // Use test API endpoint for now
        const res = await fetch(`/api/test-summary/${sipId}`, {
          method: "GET",
          signal: controller.signal,
        })
        console.log(`API response status for SIP ${sipId}:`, res.status)
        const data = await res.json()
        if (res.ok) {
          console.log(`Successfully fetched summary for SIP ${sipId}`)
          setSummary(data.summary)
          setIsFallback(data.fallback || false)
        } else {
          console.error(`Error fetching summary for SIP ${sipId}:`, data.error)
          setError(data.error || "Failed to fetch discussion summary")
        }
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error(`Exception fetching summary for SIP ${sipId}:`, err)
          setError("Failed to fetch discussion summary")
        }
      } finally {
        setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [sipId, commentCount])

  // Don't render anything if there are no comments
  if (commentCount === 0) {
    console.log(`Not rendering discussion summary for SIP ${sipId} (no comments)`)
    return null
  }

  console.log(`Rendering discussion summary for SIP ${sipId} (${commentCount} comments)`)
  
  return (
    <Card className={cn("border border-muted bg-muted/30", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="bg-primary/20 p-1.5 rounded-full">
            {isFallback ? (
              <MessageSquare className="h-4 w-4 text-primary" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
          </div>
          Discussion Summary
          {loading && (
            <span className="text-xs text-primary ml-2 animate-pulse">
              Generating...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading && (
          <div className="space-y-4">
            <div>
              <Skeleton className="h-5 w-[60%] mb-2 animate-wave" style={{ animationDelay: "0ms" }} />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full animate-wave" style={{ animationDelay: "100ms" }} />
                <Skeleton className="h-4 w-[95%] animate-wave" style={{ animationDelay: "200ms" }} />
                <Skeleton className="h-4 w-[90%] animate-wave" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
            
            <div>
              <Skeleton className="h-5 w-[60%] mb-2 animate-wave" style={{ animationDelay: "400ms" }} />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full animate-wave" style={{ animationDelay: "500ms" }} />
                <Skeleton className="h-4 w-[92%] animate-wave" style={{ animationDelay: "600ms" }} />
              </div>
            </div>
          </div>
        )}
        
        {!loading && summary && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer content={summary} />
          </div>
        )}
        
        {!loading && error && (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Discussion summary unavailable. Please try again later.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 