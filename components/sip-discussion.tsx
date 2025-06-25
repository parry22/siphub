"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface GitHubComment {
  id: number
  user: {
    login: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
  body: string
  html_url: string
}

interface SipDiscussionProps {
  comments: GitHubComment[]
}

export function SipDiscussion({ comments }: SipDiscussionProps) {
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
    return `${Math.floor(diffInSeconds / 31536000)}y ago`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Discussion
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to discuss this SIP!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={comment.user.avatar_url || "/placeholder.svg"}
                      alt={comment.user.login}
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-sm">{comment.user.login}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(comment.created_at)}
                        {comment.updated_at !== comment.created_at && " (edited)"}
                      </div>
                    </div>
                  </div>
                  <a
                    href={comment.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View on GitHub
                  </a>
                </div>

                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{comment.body}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
