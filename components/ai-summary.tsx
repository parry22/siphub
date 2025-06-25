"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface AISummaryProps {
  sipId: string
  className?: string
}

export function AISummary({ sipId, className }: AISummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/ai-summary/${sipId}`, {
          method: "GET",
          signal: controller.signal,
        })
        const data = await res.json()
        if (res.ok) {
          setSummary(data.summary)
          setIsFallback(data.fallback || false)
        } else {
          setError(data.error || "Failed to fetch summary")
        }
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          setError("Failed to fetch summary")
        }
      } finally {
        setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [sipId])

  return (
    <Card className={cn("border border-muted bg-muted/30", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="bg-primary/20 p-1.5 rounded-full">
            {isFallback ? (
              <Bot className="h-4 w-4 text-primary" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
          </div>
          AI Summary
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
            
            <div>
              <Skeleton className="h-5 w-[60%] mb-2 animate-wave" style={{ animationDelay: "700ms" }} />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full animate-wave" style={{ animationDelay: "800ms" }} />
                <Skeleton className="h-4 w-[88%] animate-wave" style={{ animationDelay: "900ms" }} />
                <Skeleton className="h-4 w-[75%] animate-wave" style={{ animationDelay: "1000ms" }} />
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
              AI summary unavailable. Please try again later.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 