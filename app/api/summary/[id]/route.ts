// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { fetchCommentsCached } from "@/lib/github-api"

// Add dynamic export to prevent static export error
export const dynamic = 'force-dynamic'

// Use environment variable instead of hardcoded API key
const GROQ_API_KEY = process.env.GROQ_API_KEY || ""

async function generateDiscussionSummary(sipId: string, comments: any[]): Promise<string> {
  try {
    if (!comments || comments.length === 0) {
      return "No comments available to summarize."
    }

    // Format comments for the prompt
    const formattedComments = comments.map(comment => {
      return `User: ${comment.user.login}
Date: ${new Date(comment.created_at).toLocaleDateString()}
Comment: ${comment.body}
---`
    }).join("\n\n")

    const prompt = `
You are an AI assistant specialized in summarizing discussions about Sui Improvement Proposals (SIPs).
Please provide a concise summary of the following discussion about SIP-${sipId} with these sections:

## Key Points
Summarize 3-5 main points discussed in the comments.

## Areas of Agreement
Identify 1-3 areas where participants seem to agree.

## Areas of Concern
Identify 1-3 areas where participants raised concerns or disagreements.

## Next Steps
Based on the discussion, what are the likely next steps for this SIP?

Here are the comments to summarize:

${formattedComments}

Keep your response concise and focused. Format your response in Markdown.
`

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes technical discussions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      })
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("Error generating discussion summary with Groq:", error)
    throw error
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    
    console.log(`API route: Generating discussion summary for SIP ${id}...`)
    
    // Fetch comments
    const comments = await fetchCommentsCached(id)
    
    if (!comments || comments.length === 0) {
      return NextResponse.json(
        { summary: "No comments available for this SIP." },
        { status: 200 }
      )
    }
    
    // Generate summary using Groq
    const summary = await generateDiscussionSummary(id, comments)
    
    return NextResponse.json({ summary })
    
  } catch (error) {
    console.error("API Error:", error)
    
    // Return a fallback summary if there's an error
    const fallbackSummary = `
## Key Points
- This SIP has received some comments from the community
- The discussion covers technical aspects and potential implementation details
- Contributors have shared their perspectives on the proposal

## Areas of Agreement
- There appears to be general interest in the concept proposed in this SIP

## Areas of Concern
- Some implementation details may need further clarification

## Next Steps
- The author may need to address comments and potentially revise the proposal
`
    
    // Return fallback with 200 status to avoid client-side errors
    return NextResponse.json({ 
      summary: fallbackSummary,
      fallback: true
    })
  }
} 