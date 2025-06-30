import { NextRequest, NextResponse } from "next/server"
import { fetchAllSips } from "@/lib/github-api"

// Add dynamic export to prevent static export error
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log("API route: Starting to fetch SIPs...")
    
    // Try to fetch from GitHub API
    try {
      const response = await fetchAllSips()
      
      if (!response.rateLimited && response.data.length > 0) {
        console.log(`API route: Successfully fetched ${response.data.length} SIPs from GitHub`)
        return NextResponse.json(response.data)
      }
      
      console.log("API route: GitHub API rate limited or returned empty data, using mock data")
    } catch (error) {
      console.error("API Error:", error)
      console.log("API route: Error fetching from GitHub API, using mock data")
    }
    
    // Fallback to mock data if GitHub API fails
    const mockSips = [
      {
        id: 1,
        number: 58,
        title: "SIP-58: Add more tx_context",
        body: "This SIP proposes adding new functions to tx_context",
        state: "open",
        merged_at: null,
        created_at: "2023-06-01T00:00:00Z",
        updated_at: "2023-06-02T00:00:00Z",
        html_url: "https://github.com/sui-foundation/sips/pull/58",
        user: { login: "user1", avatar_url: "https://github.com/user1.png" },
        labels: [{ name: "framework", color: "blue" }],
        comments: 2,
        review_comments: 1,
        total_comments: 3
      },
      {
        id: 2,
        number: 57,
        title: "SIP-57: UpgradedPackageEvent",
        body: "This SIP proposes adding UpgradedPackageEvent",
        state: "closed",
        merged_at: "2023-05-15T00:00:00Z",
        created_at: "2023-05-01T00:00:00Z",
        updated_at: "2023-05-15T00:00:00Z",
        html_url: "https://github.com/sui-foundation/sips/pull/57",
        user: { login: "user2", avatar_url: "https://github.com/user2.png" },
        labels: [{ name: "framework", color: "blue" }],
        comments: 5,
        review_comments: 3,
        total_comments: 8
      },
      {
        id: 3,
        number: 56,
        title: "SIP-56: Attestation Registry",
        body: "This SIP proposes adding Attestation Registry",
        state: "closed",
        merged_at: "2023-04-20T00:00:00Z",
        created_at: "2023-04-01T00:00:00Z",
        updated_at: "2023-04-20T00:00:00Z",
        html_url: "https://github.com/sui-foundation/sips/pull/56",
        user: { login: "user3", avatar_url: "https://github.com/user3.png" },
        labels: [{ name: "framework", color: "blue" }],
        comments: 4,
        review_comments: 2,
        total_comments: 6
      },
      {
        id: 4,
        number: 55,
        title: "SIP-55: Infallible PTBs",
        body: "This SIP proposes Infallible PTBs",
        state: "closed",
        merged_at: "2023-03-15T00:00:00Z",
        created_at: "2023-03-01T00:00:00Z",
        updated_at: "2023-03-15T00:00:00Z",
        html_url: "https://github.com/sui-foundation/sips/pull/55",
        user: { login: "user4", avatar_url: "https://github.com/user4.png" },
        labels: [{ name: "framework", color: "blue" }],
        comments: 3,
        review_comments: 2,
        total_comments: 5
      },
      {
        id: 5,
        number: 54,
        title: "SIP-54: One-Click Trading",
        body: "This SIP proposes One-Click Trading",
        state: "open",
        merged_at: null,
        created_at: "2023-02-15T00:00:00Z",
        updated_at: "2023-02-16T00:00:00Z",
        html_url: "https://github.com/sui-foundation/sips/pull/54",
        user: { login: "user5", avatar_url: "https://github.com/user5.png" },
        labels: [{ name: "framework", color: "blue" }],
        comments: 6,
        review_comments: 3,
        total_comments: 9
      }
    ]
    
    console.log(`API route: Returning ${mockSips.length} mock SIPs`)
    return NextResponse.json(mockSips)
    
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch SIPs" }, { status: 500 })
  }
}
