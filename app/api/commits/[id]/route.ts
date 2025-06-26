import { NextRequest, NextResponse } from "next/server"
import { fetchCommits } from "@/lib/github-api"

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Properly access the id parameter from context
  const { id } = context.params
  try {
    console.log(`API route: Fetching commits for SIP ${id}...`)
    
    // Try to fetch from GitHub API
    try {
      const response = await fetchCommits(id)
      
      if (!response.rateLimited && response.data && response.data.length > 0) {
        console.log(`API route: Successfully fetched ${response.data.length} commits for SIP ${id}`)
        return NextResponse.json(response.data)
      }
      
      console.log(`API route: GitHub API rate limited or returned no commits for SIP ${id}, using mock data`)
    } catch (error) {
      console.error("API Error:", error)
      console.log(`API route: Error fetching commits for SIP ${id}, using mock data`)
    }
    
    // Fallback to mock data if GitHub API fails
    const mockCommits = [
      {
        sha: "abc123def456",
        commit: {
          message: `[SIP-${id}] Initial draft`,
          author: {
            name: "Author 1",
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        html_url: `https://github.com/sui-foundation/sips/commit/abc123def456`
      },
      {
        sha: "def456ghi789",
        commit: {
          message: `[SIP-${id}] Update specification section`,
          author: {
            name: "Author 2",
            date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        html_url: `https://github.com/sui-foundation/sips/commit/def456ghi789`
      },
      {
        sha: "ghi789jkl012",
        commit: {
          message: `[SIP-${id}] Add test cases`,
          author: {
            name: "Author 1",
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        html_url: `https://github.com/sui-foundation/sips/commit/ghi789jkl012`
      },
      {
        sha: "jkl012mno345",
        commit: {
          message: `[SIP-${id}] Address review comments`,
          author: {
            name: "Author 1",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        html_url: `https://github.com/sui-foundation/sips/commit/jkl012mno345`
      },
      {
        sha: "mno345pqr678",
        commit: {
          message: `[SIP-${id}] Finalize implementation`,
          author: {
            name: "Author 2",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        html_url: `https://github.com/sui-foundation/sips/commit/mno345pqr678`
      }
    ]
    
    console.log(`API route: Returning ${mockCommits.length} mock commits for SIP ${id}`)
    return NextResponse.json(mockCommits)
    
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: `Failed to fetch commits for SIP ${id}` },
      { status: 500 }
    )
  }
}
