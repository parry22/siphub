import { type NextRequest, NextResponse } from "next/server"
import { fetchAllSips, fetchPRDetails, fetchSipContent, fetchPRComments } from "@/lib/github-api"

// Add dynamic export to prevent static export error
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log("Chatbot API: Request received")

    // Parse request body with error handling
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error("Chatbot API: Failed to parse request body:", error)
      return NextResponse.json(
        {
          error: "Invalid request body",
          response: "I couldn't understand your request. Please try again.",
        },
        { status: 400 },
      )
    }

    const { text } = requestBody

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      console.error("Chatbot API: Invalid or empty text provided")
      return NextResponse.json(
        {
          error: "Invalid text provided",
          response: "Please provide a question or message.",
        },
        { status: 400 },
      )
    }

    if (text.length > 5000) {
      console.error("Chatbot API: Text too long:", text.length)
      return NextResponse.json(
        {
          error: "Text too long",
          response: "Your message is too long. Please keep it under 5000 characters.",
        },
        { status: 400 },
      )
    }

    // Check if the query is about a specific SIP
    const sipMatch = text.match(/\b(?:SIP|sip)[-\s]?(\d+)\b/) || text.match(/\bSIP\s+#?(\d+)\b/i)
    let sipContext = ""

    if (sipMatch) {
      const sipNumber = sipMatch[1]
      console.log(`Chatbot API: Detected question about SIP ${sipNumber}, fetching context...`)
      
      try {
        // Fetch SIP details
        const sipDetails = await fetchPRDetails(sipNumber)
        
        if (sipDetails) {
          // Fetch SIP content
          const sipContent = await fetchSipContent(sipNumber)
          
          // Fetch comments
          const comments = await fetchPRComments(sipNumber)
          
          // Build context
          sipContext = `
Information about SIP-${sipNumber}:

Title: ${sipDetails.title || "Unknown"}
Author: ${sipDetails.user?.login || "Unknown"}
Status: ${sipDetails.state === "open" ? "Open" : sipDetails.merged_at ? "Merged" : "Closed"}
Created: ${new Date(sipDetails.created_at).toLocaleDateString()}
${sipDetails.labels?.length ? `Labels: ${sipDetails.labels.map(l => l.name).join(", ")}` : ""}

Content:
${sipContent ? sipContent.substring(0, 4000) : "Content not available"}

${comments.length > 0 ? `
Comments (${comments.length}):
${comments.slice(0, 3).map(c => `${c.user.login}: ${c.body.substring(0, 200)}${c.body.length > 200 ? '...' : ''}`).join('\n\n')}
${comments.length > 3 ? `\n...and ${comments.length - 3} more comments` : ''}` : "No comments available"}
`
        } else {
          sipContext = `I couldn't find specific information about SIP-${sipNumber}.`
        }
      } catch (error) {
        console.error(`Chatbot API: Error fetching SIP-${sipNumber} information:`, error)
        sipContext = `I tried to fetch information about SIP-${sipNumber}, but encountered an error.`
      }
    } else {
      // Check if the query is about SIPs in general
      const sipsMatch = text.toLowerCase().includes("sips") || 
                        text.toLowerCase().includes("sui improvement proposals") ||
                        text.toLowerCase().includes("proposals")
      
      if (sipsMatch) {
        try {
          // Fetch general SIP information
          const allSipsResponse = await fetchAllSips()
          
          if (!allSipsResponse.rateLimited && allSipsResponse.data.length > 0) {
            const sips = allSipsResponse.data
            
            // Get counts
            const openSips = sips.filter(sip => sip.state === "open").length
            const mergedSips = sips.filter(sip => sip.merged_at !== null).length
            const closedSips = sips.filter(sip => sip.state === "closed" && !sip.merged_at).length
            
            // Get recent SIPs
            const recentSips = sips.slice(0, 5).map(sip => ({
              number: sip.number,
              title: sip.title,
              state: sip.state === "open" ? "Open" : sip.merged_at ? "Merged" : "Closed"
            }))
            
            sipContext = `
General information about SIPs:

Total SIPs: ${sips.length}
Open SIPs: ${openSips}
Merged SIPs: ${mergedSips}
Closed SIPs: ${closedSips}

Recent SIPs:
${recentSips.map(sip => `SIP-${sip.number}: ${sip.title} (${sip.state})`).join('\n')}
`
          }
        } catch (error) {
          console.error("Chatbot API: Error fetching general SIP information:", error)
        }
      }
    }

    const apiKey = process.env.GROQ_API_KEY || ""

    if (!apiKey) {
      console.error("Chatbot API: GROQ API key not configured")
      return NextResponse.json({
        error: "API key not configured",
        response: "I'm sorry, but I'm not configured properly. Please contact the administrator.",
      })
    }

    console.log("Chatbot API: Calling Groq API")

    // Add timeout to Groq API call
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    let groqResponse
    try {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant specializing in Sui Improvement Proposals (SIPs). You provide concise, accurate answers about SIPs, their technical details, and their impact on the Sui blockchain ecosystem. Answer questions in a friendly, informative manner. If you don't know something, admit it rather than making up information. Use the context provided to answer questions about specific SIPs when available.",
            },
            ...(sipContext ? [
              {
                role: "system",
                content: `Here is additional context that may help you answer the question: ${sipContext}`
              }
            ] : []),
            {
              role: "user",
              content: `${text}`,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("Chatbot API: Groq API request timed out")
        return NextResponse.json(
          {
            error: "Request timed out",
            response: "I'm sorry, but your request took too long to process. Please try a shorter question.",
          },
          { status: 408 },
        )
      }

      console.error("Chatbot API: Network error calling Groq API:", fetchError)
      return NextResponse.json(
        {
          error: "Network error",
          response: "I'm having trouble connecting to my knowledge base. Please try again later.",
        },
        { status: 503 },
      )
    }

    clearTimeout(timeoutId)

    if (!groqResponse.ok) {
      console.error("Chatbot API: Groq API error:", groqResponse.status, groqResponse.statusText)

      // Try to get error details
      try {
        const errorText = await groqResponse.text()
        console.error("Chatbot API: Groq API error details:", errorText.substring(0, 500))

        // Check for rate limiting
        if (groqResponse.status === 429) {
          return NextResponse.json(
            {
              error: "Rate limited",
              response: "I'm receiving too many requests right now. Please try again in a moment.",
            },
            { status: 429 },
          )
        }
      } catch (textError) {
        console.error("Chatbot API: Could not read Groq API error response")
      }

      return NextResponse.json(
        {
          error: `Groq API error: ${groqResponse.status}`,
          response: "I'm having trouble processing your request. Please try again later.",
        },
        { status: 502 },
      )
    }

    let data
    try {
      const responseText = await groqResponse.text()

      if (!responseText || !responseText.trim()) {
        console.error("Chatbot API: Empty response from Groq API")
        return NextResponse.json({
          error: "Empty response",
          response: "I couldn't generate a response. Please try again.",
        })
      }

      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Chatbot API: Failed to parse Groq API response as JSON:", parseError)
      return NextResponse.json({
        error: "Invalid response format",
        response: "I received an invalid response. Please try again.",
      })
    }

    const response = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    if (!response || response === "I'm sorry, I couldn't generate a response.") {
      console.error("Chatbot API: No valid response in Groq response")
      return NextResponse.json({
        error: "No response generated",
        response: "I'm sorry, I couldn't generate a response.",
      })
    }

    console.log("Chatbot API: Successfully generated response")
    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chatbot API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        response: "I encountered an unexpected error. Please try again later.",
      },
      { status: 500 },
    )
  }
} 