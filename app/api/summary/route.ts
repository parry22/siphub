// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"

// Add dynamic export to prevent static export error
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Please provide a SIP ID" },
    { status: 400 }
  )
}

export async function POST(request: NextRequest) {
  try {
    console.log("Summary API: Request received")

    // Parse request body with error handling
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error("Summary API: Failed to parse request body:", error)
      return NextResponse.json(
        {
          error: "Invalid request body",
          summary: "Summary unavailable",
        },
        { status: 400 },
      )
    }

    const { text } = requestBody

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      console.error("Summary API: Invalid or empty text provided")
      return NextResponse.json(
        {
          error: "Invalid text provided",
          summary: "Summary unavailable",
        },
        { status: 400 },
      )
    }

    if (text.length > 5000) {
      console.error("Summary API: Text too long:", text.length)
      return NextResponse.json(
        {
          error: "Text too long",
          summary: "Summary unavailable",
        },
        { status: 400 },
      )
    }

    const apiKey = process.env.GROQ_API_KEY || ""

    if (!apiKey) {
      console.error("Summary API: GROQ API key not configured")
      return NextResponse.json({
        error: "API key not configured",
        summary: "Summary unavailable",
      })
    }

    console.log("Summary API: Calling Groq API for text length:", text.length)

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
                "You are a helpful assistant specializing in Sui Improvement Proposals (SIPs). You provide concise, accurate answers about SIPs, their technical details, and their impact on the Sui blockchain ecosystem. Answer questions in a friendly, informative manner. If you don't know something, admit it rather than making up information.",
            },
            {
              role: "user",
              content: `${text}`,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("Summary API: Groq API request timed out")
        return NextResponse.json(
          {
            error: "Request timed out",
            summary: "Summary unavailable",
          },
          { status: 408 },
        )
      }

      console.error("Summary API: Network error calling Groq API:", fetchError)
      return NextResponse.json(
        {
          error: "Network error",
          summary: "Summary unavailable",
        },
        { status: 503 },
      )
    }

    clearTimeout(timeoutId)

    if (!groqResponse.ok) {
      console.error("Summary API: Groq API error:", groqResponse.status, groqResponse.statusText)

      // Try to get error details
      try {
        const errorText = await groqResponse.text()
        console.error("Summary API: Groq API error details:", errorText.substring(0, 500))

        // Check for rate limiting
        if (groqResponse.status === 429) {
          return NextResponse.json(
            {
              error: "Rate limited",
              summary: "Summary unavailable",
            },
            { status: 429 },
          )
        }
      } catch (textError) {
        console.error("Summary API: Could not read Groq API error response")
      }

      return NextResponse.json(
        {
          error: `Groq API error: ${groqResponse.status}`,
          summary: "Summary unavailable",
        },
        { status: 502 },
      )
    }

    let data
    try {
      const responseText = await groqResponse.text()

      if (!responseText || !responseText.trim()) {
        console.error("Summary API: Empty response from Groq API")
        return NextResponse.json({
          error: "Empty response",
          summary: "Summary unavailable",
        })
      }

      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Summary API: Failed to parse Groq API response as JSON:", parseError)
      return NextResponse.json({
        error: "Invalid response format",
        summary: "Summary unavailable",
      })
    }

    const summary = data.choices?.[0]?.message?.content || "Summary unavailable"

    if (!summary || summary === "Summary unavailable") {
      console.error("Summary API: No valid summary in Groq response")
      return NextResponse.json({
        error: "No summary generated",
        summary: "Summary unavailable",
      })
    }

    console.log("Summary API: Successfully generated summary")
    return NextResponse.json({ summary })
  } catch (error) {
    console.error("Summary API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        summary: "Summary unavailable",
      },
      { status: 500 },
    )
  }
}
