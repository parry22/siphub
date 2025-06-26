// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { fetchPRDetailsCached, fetchSipContentCached } from "@/lib/github-api"

// Use environment variable instead of hardcoded API key
const GROQ_API_KEY = process.env.GROQ_API_KEY || ""

async function generateGroqSummary(sipId: string, content: string, title: string): Promise<string> {
  try {
    const prompt = `
You are an AI assistant specialized in summarizing Sui Improvement Proposals (SIPs).
Please provide a concise summary of the following SIP with these sections:

## What this SIP is
Explain what this SIP proposes in 2-3 sentences.

## What it changes
Explain the technical changes this SIP introduces in 2-3 sentences.

## Why it matters
Explain why this SIP is important for the Sui ecosystem in 2-3 sentences.

Here's the SIP to summarize:
Title: ${title}

Content:
${content}

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
            content: "You are a helpful assistant that summarizes technical proposals."
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
    console.error("Error generating summary with Groq:", error)
    throw error
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params
  
  try {
    console.log(`API route: Generating AI summary for SIP ${id}...`)
    
    // Fetch SIP details and content
    const [sipDetails, sipContent] = await Promise.all([
      fetchPRDetailsCached(id),
      fetchSipContentCached(id)
    ])
    
    if (!sipDetails) {
      return NextResponse.json(
        { error: `SIP ${id} not found` },
        { status: 404 }
      )
    }
    
    // Use the PR body if content is not available
    const contentToSummarize = sipContent || sipDetails.body || ""
    
    if (!contentToSummarize) {
      return NextResponse.json(
        { error: `No content available for SIP ${id}` },
        { status: 404 }
      )
    }
    
    // Generate summary using Groq
    const summary = await generateGroqSummary(id, contentToSummarize, sipDetails.title)
    
    return NextResponse.json({ summary })
    
  } catch (error) {
    console.error("API Error:", error)
    
    // Return a fallback summary if there's an error
    const fallbackSummary = `
## What this SIP is
SIP-${id} proposes a new feature or improvement to the Sui blockchain platform. This is a fallback summary as we couldn't generate a detailed one at this time.

## What it changes
This SIP would introduce changes to the Sui framework, potentially affecting how developers interact with the platform or how the blockchain processes transactions.

## Why it matters
If implemented, this SIP could improve the developer experience, enhance performance, or add new capabilities to the Sui blockchain.
`
    
    // Return fallback with 200 status to avoid client-side errors
    return NextResponse.json({ 
      summary: fallbackSummary,
      fallback: true
    })
  }
} 