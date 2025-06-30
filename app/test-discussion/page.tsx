"use client"

import { useState } from "react"
import { DiscussionSummary } from "@/components/discussion-summary"

export default function TestDiscussionPage() {
  const [sipId, setSipId] = useState("49")
  const [commentCount, setCommentCount] = useState(7)

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Test Discussion Summary Component</h1>
      
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block mb-2">SIP ID</label>
          <input 
            type="text" 
            value={sipId} 
            onChange={(e) => setSipId(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        
        <div>
          <label className="block mb-2">Comment Count</label>
          <input 
            type="number" 
            value={commentCount} 
            onChange={(e) => setCommentCount(Number(e.target.value))}
            className="border p-2 rounded"
          />
        </div>
      </div>
      
      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-4">Discussion Summary Component</h2>
        <DiscussionSummary sipId={sipId} commentCount={commentCount} />
      </div>
    </div>
  )
} 