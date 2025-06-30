// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"

// Add dynamic export to prevent static export error
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    
    console.log(`Test API route: Generating test summary for SIP ${id}...`)
    
    // Return a test summary
    const testSummary = `
## Key Points
- This is a test summary for SIP ${id}
- It demonstrates the discussion summary component
- The API is working correctly

## Areas of Agreement
- Everyone agrees this is a test

## Areas of Concern
- This is only a test summary

## Next Steps
- Implement the real summary API
`
    
    // Simulate a delay to test loading state
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return NextResponse.json({ summary: testSummary })
    
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Test API error" },
      { status: 500 }
    )
  }
} 