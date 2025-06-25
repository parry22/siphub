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
    title: `${sipDetails.title} | SIPs Hub`,
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
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold">{pr.title}</CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" /> Created {createdAt}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <GitCommitHorizontal className="h-4 w-4" /> Updated {updatedAt}
                    </span>
                  </CardDescription>
                </div>
                <Badge className={`${statusColor} text-white`}>{status}</Badge>
              </div>
            </CardHeader>
            
            {/* AI Summary - Visible only on mobile */}
            <div className="lg:hidden px-6 pb-4">
              <AISummary sipId={id} />
            </div>
            
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <div className="text-muted-foreground">
                    No content available for this SIP.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
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
            </CardFooter>
          </Card>
          
          {/* Comments section */}
          <SipDiscussion comments={comments} />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Summary - Visible only on desktop */}
          <div className="hidden lg:block">
            <AISummary sipId={id} />
          </div>
          
          {/* Labels */}
          <Card>
            <CardHeader>
              <CardTitle>Labels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {pr.labels && pr.labels.length > 0 ? (
                  pr.labels.map((label) => (
                    <Badge key={label.name} variant="outline" className="border-2" style={{ borderColor: `#${label.color}` }}>
                      {label.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No labels</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Related SIPs */}
          <Card>
            <CardHeader>
              <CardTitle>Related SIPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would be populated with actual related SIPs */}
                <div className="text-muted-foreground text-sm">
                  No related SIPs found.
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
