import React from "react"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarIcon, GitCommitHorizontal, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fetchPRDetailsCached as fetchSipDetailsCached, fetchPRCommentsCached as fetchCommentsCached, fetchSipContentCached } from "@/lib/github-api"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { SipDiscussion } from "@/components/sip-discussion"
import { AISummary } from "@/components/ai-summary"
import { DiscussionSummary } from "@/components/discussion-summary"

interface SipPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: SipPageProps): Promise<Metadata> {
  const id = params.id
  const sipDetails = await fetchSipDetailsCached(id)
  
  if (!sipDetails) {
    return {
      title: "SIP Not Found",
      description: "The requested SIP could not be found.",
    }
  }
  
  return {
    title: `${sipDetails.title} | Sui Digest`,
    description: sipDetails.body?.substring(0, 160) || "No description available.",
  }
}

export default async function SipPage({ params }: SipPageProps) {
  const id = params.id
  
  // Fetch all data in parallel
  const prPromise = fetchSipDetailsCached(id)
  const commentsPromise = fetchCommentsCached(id)
  const contentPromise = fetchSipContentCached(id)
  
  // Wait for all promises to resolve
  const [pr, comments, content] = await Promise.all([
    prPromise,
    commentsPromise,
    contentPromise,
  ])
  
  // If PR not found, show 404
  if (!pr) {
    notFound()
  }
  
  // Format dates
  const createdAt = formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })
  const updatedAt = formatDistanceToNow(new Date(pr.updated_at), { addSuffix: true })
  
  // Determine status
  const status = pr.state === "open" ? "Open" : pr.merged_at ? "Merged" : "Closed"
  const statusColor = 
    status === "Open" ? "bg-green-500" : 
    status === "Merged" ? "bg-purple-500" : 
    "bg-red-500"
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="space-y-8">
        {/* Main content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{pr.title}</h1>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1 mb-2 sm:mb-0">
                    <CalendarIcon className="h-4 w-4" /> Created {createdAt}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <GitCommitHorizontal className="h-4 w-4" /> Updated {updatedAt}
                  </span>
                </div>
              </div>
              <Badge className={`${statusColor} text-white`}>{status}</Badge>
            </div>
          </div>
          
          {/* AI Summary */}
          <div className="py-4">
            <AISummary sipId={id} />
          </div>
          
          {/* Content */}
          <div className="prose max-w-none dark:prose-invert">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <div className="text-muted-foreground">
                No content available for this SIP.
              </div>
            )}
          </div>
          
          {/* Author info */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={pr.user.avatar_url} alt={pr.user.login} />
                <AvatarFallback>{pr.user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{pr.user.login}</p>
                <p className="text-xs text-muted-foreground">Author</p>
              </div>
            </div>
          </div>
          
          {/* Comments section */}
          <div className="mt-10 pt-6 border-t">
            {/* Discussion Summary - only shows if there are comments */}
            {comments.length > 0 && (
              <div className="mb-8">
                <DiscussionSummary sipId={id} commentCount={comments.length} />
              </div>
            )}
            <SipDiscussion comments={comments} />
          </div>
        </div>
        
        {/* Links */}
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Links</h2>
          <div className="space-y-2">
            <a 
              href={pr.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center gap-1"
            >
              <GitCommitHorizontal className="h-4 w-4" />
              View on GitHub
            </a>
            <a 
              href={`${pr.html_url}/files`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center gap-1"
            >
              <GitCommitHorizontal className="h-4 w-4" />
              View Changes
            </a>
            <a 
              href={`${pr.html_url}#discussion`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" />
              View Discussion
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
