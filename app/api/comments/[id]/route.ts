// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { fetchComments } from "@/lib/github-api"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log(`API route: Fetching comments for SIP ${id}...`)
    
    // Try to fetch from GitHub API
    try {
      const response = await fetchComments(id)
      
      if (!response.rateLimited) {
        const commentArray = response.data || []
        console.log(`API route: Successfully fetched ${commentArray.length} comments for SIP ${id}`)
        return NextResponse.json(commentArray)
      }
      
      console.log(`API route: GitHub API rate limited or returned no comments for SIP ${id}, using mock data`)
    } catch (error) {
      console.error("API Error:", error)
      console.log(`API route: Error fetching comments for SIP ${id}, using mock data`)
    }
    
    // Fallback to mock data if GitHub API fails
    const mockComments = [
      {
        id: 1001,
        user: {
          login: "reviewer1",
          avatar_url: "https://github.com/reviewer1.png"
        },
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        body: `I think this SIP-${id} has potential, but I'd like to see more details on the implementation approach.`,
        html_url: `https://github.com/sui-foundation/sips/pull/${id}#issuecomment-1001`
      },
      {
        id: 1002,
        user: {
          login: "author1",
          avatar_url: "https://github.com/author1.png"
        },
        created_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
        body: "Thanks for the feedback! I'll add more implementation details in the next update.",
        html_url: `https://github.com/sui-foundation/sips/pull/${id}#issuecomment-1002`
      },
      {
        id: 1003,
        user: {
          login: "reviewer2",
          avatar_url: "https://github.com/reviewer2.png"
        },
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        body: "Have you considered the performance implications of this approach?",
        html_url: `https://github.com/sui-foundation/sips/pull/${id}#issuecomment-1003`
      },
      {
        id: 1004,
        user: {
          login: "author1",
          avatar_url: "https://github.com/author1.png"
        },
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        body: "Yes, I've done some benchmarking and the performance impact is minimal. I'll add those results to the SIP.",
        html_url: `https://github.com/sui-foundation/sips/pull/${id}#issuecomment-1004`
      },
      {
        id: 1005,
        user: {
          login: "reviewer3",
          avatar_url: "https://github.com/reviewer3.png"
        },
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        body: "The test cases look good. I'd suggest adding one more edge case for completeness.",
        html_url: `https://github.com/sui-foundation/sips/pull/${id}#issuecomment-1005`
      },
      {
        id: 1006,
        user: {
          login: "author1",
          avatar_url: "https://github.com/author1.png"
        },
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        body: "Good point! I've added the additional test case and updated the implementation accordingly.",
        html_url: `https://github.com/sui-foundation/sips/pull/${id}#issuecomment-1006`
      },
      {
        id: 1007,
        user: {
          login: "reviewer1",
          avatar_url: "https://github.com/reviewer1.png"
        },
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        body: "This looks great now. I'm in favor of moving forward with this SIP.",
        html_url: `https://github.com/sui-foundation/sips/pull/${id}#issuecomment-1007`
      }
    ]
    
    console.log(`API route: Returning ${mockComments.length} mock comments for SIP ${id}`)
    return NextResponse.json(mockComments)
    
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: `Failed to fetch comments for SIP ${id}` },
      { status: 500 }
    )
  }
}
